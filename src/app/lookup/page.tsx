"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { NetworkType, BadgeData } from "@/lib/types";
import NetworkSwitch from "@/components/NetworkSwitch";
import BadgePreview from "@/components/BadgePreview";

interface BadgeMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

interface BadgeResult {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata: BadgeMetadata | null;
}

interface LookupData {
  query: string;
  queryType: "address" | "tokenId" | "nftAddress";
  network: string;
  contractAddress: string;
  badges: BadgeResult[];
}

export default function LookupPage() {
  return (
    <Suspense>
      <LookupPageContent />
    </Suspense>
  );
}

function LookupPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [network, setNetwork] = useState<NetworkType>("amoy");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSearched, setAutoSearched] = useState(false);

  const handleLookup = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/lookup?query=${encodeURIComponent(q.trim())}&network=${network}`
      );
      const data = await response.json();
      if (!data.success) {
        setError(data.error || "Lookup failed");
      } else {
        setResult(data.data);
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [query, network]);

  // Auto-search from URL query param (e.g., /lookup?q=0)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoSearched) {
      setQuery(q);
      setAutoSearched(true);
      handleLookup(q);
    }
  }, [searchParams, autoSearched, handleLookup]);

  const explorerBase = network === "amoy" ? "https://amoy.polygonscan.com" : "https://polygonscan.com";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-elca-orange flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-elca-dark tracking-wide">
                EDI Badge Protocol
              </h1>
              <p className="text-[10px] text-elca-gray">Badge Lookup</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-elca-gray hover:text-elca-dark transition-all"
            >
              Mint
            </Link>
            <NetworkSwitch network={network} onChange={setNetwork} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-elca-dark mb-2">Badge Lookup</h2>
        <p className="text-sm text-elca-gray mb-8">
          Enter a wallet address or token ID to view EDI Badges.
        </p>

        {/* Search */}
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup(query)}
            placeholder="Wallet (0x...), Token ID (0, 1...), or NFT address (0x.../0)"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-elca-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-elca-orange/30 focus:border-elca-orange transition-all"
          />
          <button
            onClick={() => handleLookup(query)}
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 rounded-full bg-elca-orange text-white text-sm font-semibold tracking-wide hover:bg-elca-orange-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching...
              </span>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600 animate-slide-in-up">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 animate-slide-in-up">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-elca-gray">
                Found <span className="font-semibold text-elca-dark">{result.badges.length}</span>{" "}
                badge{result.badges.length !== 1 ? "s" : ""}
                {result.queryType === "address" && (
                  <> for <span className="font-mono text-xs">{result.query.slice(0, 6)}...{result.query.slice(-4)}</span></>
                )}
                {result.queryType === "tokenId" && (
                  <> with Token ID #{result.query}</>
                )}
                {result.queryType === "nftAddress" && (
                  <> for NFT <span className="font-mono text-xs">{result.query}</span></>
                )}
              </p>
              {result.queryType === "address" && (
                <a
                  href={`${explorerBase}/address/${result.query}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-elca-orange hover:underline"
                >
                  View on PolygonScan
                </a>
              )}
            </div>

            {result.badges.length === 0 && (
              <div className="text-center py-16 text-elca-gray">
                <p className="text-lg font-semibold">No badges found</p>
                <p className="text-sm mt-2">
                  {result.queryType === "tokenId"
                    ? `Token #${result.query} does not exist.`
                    : `This address has no EDI Badges on ${network === "amoy" ? "Amoy Testnet" : "Polygon Mainnet"}.`
                  }
                </p>
                <Link href="/" className="mt-4 inline-block px-6 py-2.5 rounded-full bg-elca-orange text-white text-xs font-semibold tracking-wide hover:bg-elca-orange-dark transition-all">
                  Mint a Badge
                </Link>
              </div>
            )}

            <div className="space-y-8">
              {result.badges.map((badge) => (
                <BadgeCard
                  key={badge.tokenId}
                  badge={badge}
                  explorerBase={explorerBase}
                  contractAddress={result.contractAddress}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-elca-dark mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-gray-400">EDI Challenge 2026 — ELCA Digital Innovation</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-gray-400">
              {network === "amoy" ? "Amoy Testnet" : "Polygon Mainnet"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getAttr(badge: BadgeResult, trait: string): string {
  return badge.metadata?.attributes?.find((a) => a.trait_type === trait)?.value || "";
}

function badgeToBadgeData(badge: BadgeResult): BadgeData {
  return {
    firstName: getAttr(badge, "First Name") || "Unknown",
    lastName: getAttr(badge, "Last Name") || "",
    mainProject: getAttr(badge, "Main Project"),
    startDate: getAttr(badge, "Start Date"),
    completionDate: getAttr(badge, "Completion Date"),
    details: getAttr(badge, "Details"),
    imageLink: getAttr(badge, "Photo URL"),
    recipientWallet: badge.owner,
  };
}

function BadgeCard({
  badge,
  explorerBase,
  contractAddress,
}: {
  badge: BadgeResult;
  explorerBase: string;
  contractAddress: string;
}) {
  const badgeData = badgeToBadgeData(badge);
  const name = badgeData.firstName !== "Unknown"
    ? `${badgeData.firstName} ${badgeData.lastName}`
    : badge.metadata?.name || `Badge #${badge.tokenId}`;

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white">
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-elca-orange/10 text-elca-orange text-[10px] font-semibold tracking-wide font-mono">
              {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}/{badge.tokenId}
            </span>
            <h3 className="text-lg font-bold text-elca-dark">{name}</h3>
          </div>
          <a
            href={`${explorerBase}/token/${contractAddress}?a=${badge.tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-elca-gray hover:text-elca-orange transition-colors"
          >
            View on Explorer
          </a>
        </div>

        {/* Badge preview using the same component as the mint page */}
        <div className="max-w-[600px] mx-auto">
          <BadgePreview data={badgeData} />
        </div>

        {/* Owner + metadata link */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold text-elca-gray tracking-[1px] uppercase">Owner</p>
            <p className="text-xs font-mono text-elca-dark break-all">{badge.owner}</p>
          </div>
          {badge.tokenURI && (
            <a
              href={badge.tokenURI}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-elca-orange hover:underline"
            >
              View Metadata (IPFS)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
