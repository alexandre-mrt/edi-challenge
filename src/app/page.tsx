"use client";

import { useState, useCallback } from "react";
import type { JSX } from "react";
import Link from "next/link";
import BadgeForm from "@/components/BadgeForm";
import BadgePreview from "@/components/BadgePreview";
import NetworkSwitch from "@/components/NetworkSwitch";
import MintResult from "@/components/MintResult";
import ErrorBoundary from "@/components/ErrorBoundary";
import BadgeRevealAnimation from "@/components/BadgeRevealAnimation";
import { BadgeData, MintResponse, NetworkType } from "@/lib/types";

type AnimPhase = "idle" | "drawing" | "confirmed" | "done";

const INITIAL_DATA: BadgeData = {
  firstName: "",
  lastName: "",
  mainProject: "",
  startDate: "",
  completionDate: "",
  details: "",
  imageLink: "",
  recipientWallet: "",
};

const NETWORK_LABELS: Record<NetworkType, string> = {
  amoy: "Amoy Testnet",
  polygon: "Polygon Mainnet",
};

export default function Home(): JSX.Element {
  const [badgeData, setBadgeData] = useState<BadgeData>(INITIAL_DATA);
  const [network, setNetwork] = useState<NetworkType>("amoy");
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResponse | null>(null);
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");

  const handleAnimComplete = useCallback((): void => {
    setAnimPhase("done");
  }, []);

  const handleMint = async () => {
    setIsMinting(true);
    setMintResult(null);
    setAnimPhase("drawing");

    try {
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeData, network }),
      });

      const result: MintResponse = await response.json();
      setMintResult(result);

      if (result.success) {
        setAnimPhase("confirmed");
      } else {
        setAnimPhase("done");
      }
    } catch (error) {
      setMintResult({
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      });
      setAnimPhase("done");
    } finally {
      setIsMinting(false);
    }
  };

  const handleReset = (): void => {
    setMintResult(null);
    setAnimPhase("idle");
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-elca-orange flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-elca-dark tracking-wide">
                EDI Badge Protocol
              </h1>
              <p className="text-[10px] text-elca-gray">
                NFT Badge Generator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/lookup"
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-elca-gray hover:text-elca-dark transition-all"
            >
              Lookup
            </Link>
            <NetworkSwitch network={network} onChange={setNetwork} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1 animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left: Form */}
          <div>
            <BadgeForm
              data={badgeData}
              onChange={setBadgeData}
              onMint={handleMint}
              isMinting={isMinting}
              mintPhase={animPhase}
            />
            {mintResult && animPhase === "done" && (
              <div className="mt-6 animate-slide-in-up">
                <MintResult result={mintResult} network={network} onReset={handleReset} />
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div>
            <h2 className="text-lg font-semibold text-elca-dark tracking-wide uppercase mb-5">
              Live Preview
            </h2>
            <div className="relative">
              <div className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl rounded-2xl p-3 sm:p-4">
                <BadgePreview data={badgeData} network={network} />
              </div>
            </div>
            <p className="text-xs text-elca-gray mt-3">
              This preview updates in real-time as you fill in the form.
            </p>
          </div>
        </div>
      </main>

      {/* Badge reveal animation — full screen overlay */}
      <BadgeRevealAnimation
        isActive={animPhase === "drawing" || animPhase === "confirmed"}
        isConfirmed={animPhase === "confirmed"}
        badgeData={badgeData}
        network={network}
        onComplete={handleAnimComplete}
      />

      {/* Footer */}
      <footer className="bg-elca-dark mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-gray-400">
            EDI Challenge 2026 — ELCA Digital Innovation
          </span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-gray-400">
              {NETWORK_LABELS[network]}
            </span>
          </div>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
