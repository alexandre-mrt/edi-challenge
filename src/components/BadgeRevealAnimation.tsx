"use client";

import { useEffect, useState, useCallback } from "react";
import type { BadgeData } from "@/lib/types";

interface BadgeRevealAnimationProps {
  readonly isActive: boolean;
  readonly isConfirmed: boolean;
  readonly badgeData: BadgeData;
  readonly network?: "amoy" | "polygon";
  readonly onComplete: () => void;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

const ELEMENT_COUNT = 10;
const REVEAL_DELAY = 300; // ms between each element (fast)
const FAST_DELAY = 80;

export default function BadgeRevealAnimation({
  isActive,
  isConfirmed,
  badgeData,
  network = "amoy",
  onComplete,
}: BadgeRevealAnimationProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastFading, setToastFading] = useState(false);
  // "revealing" = elements appearing, "waiting" = all shown but tx not confirmed, "confirmed" = tx done, "done" = animation over
  const [phase, setPhase] = useState<"idle" | "revealing" | "waiting" | "confirmed" | "done">("idle");

  // Start (or restart after a previous mint)
  useEffect(() => {
    if (isActive && (phase === "idle" || phase === "done")) {
      setPhase("revealing");
      setVisibleCount(0);
      setShowToast(false);
      setToastFading(false);
    }
  }, [isActive, phase]);

  // When tx confirmed
  useEffect(() => {
    if (isConfirmed && (phase === "revealing" || phase === "waiting")) {
      setPhase("confirmed");
    }
  }, [isConfirmed, phase]);

  // Reveal elements one by one
  useEffect(() => {
    if (phase !== "revealing") return;

    if (visibleCount >= ELEMENT_COUNT) {
      // All elements shown but tx not confirmed yet — wait
      setPhase("waiting");
      return;
    }

    const delay = visibleCount < 3 ? REVEAL_DELAY : FAST_DELAY; // first 3 slower, rest fast
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [phase, visibleCount]);

  // When confirmed: show success then toast
  useEffect(() => {
    if (phase !== "confirmed") return;

    // If elements not all visible yet, quickly show remaining
    if (visibleCount < ELEMENT_COUNT) {
      const timer = setTimeout(() => setVisibleCount((c) => c + 1), 50);
      return () => clearTimeout(timer);
    }

    // All visible + confirmed: show toast after brief pause
    const t1 = setTimeout(() => {
      setShowToast(true);
      const t2 = setTimeout(() => {
        setToastFading(true);
        const t3 = setTimeout(() => {
          setPhase("done");
          onComplete();
        }, 500);
        return () => clearTimeout(t3);
      }, 2500);
      return () => clearTimeout(t2);
    }, 600);
    return () => clearTimeout(t1);
  }, [phase, visibleCount, onComplete]);

  // Reset if deactivated
  useEffect(() => {
    if (!isActive && phase !== "idle" && phase !== "done") {
      setPhase("done");
      onComplete();
    }
  }, [isActive, phase, onComplete]);

  if (phase === "idle" || (phase === "done" && !isActive)) return null;

  const name = `${badgeData.firstName || "First"} ${badgeData.lastName || "Last"}`;
  const initials = `${(badgeData.firstName || "F").charAt(0)}${(badgeData.lastName || "L").charAt(0)}`;
  const allVisible = visibleCount >= ELEMENT_COUNT;
  const dur = "duration-300";

  const vis = (index: number) =>
    visibleCount > index
      ? `opacity-100 translate-y-0 ${dur}`
      : `opacity-0 translate-y-1 ${dur}`;

  // Progress bar: fills during reveal, then pulses while waiting, solid green when confirmed
  const progressPercent = Math.min(100, (visibleCount / ELEMENT_COUNT) * 100);
  const isWaiting = phase === "waiting";
  const isDone = phase === "confirmed" && allVisible;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up">
        <div
          className="w-[90vw] max-w-[560px] rounded-2xl overflow-hidden bg-white shadow-2xl"
          style={{ boxShadow: "0 25px 80px rgba(255,72,58,0.15), 0 10px 30px rgba(0,0,0,0.1)" }}
        >
          {/* Progress bar on top */}
          <div className="h-1.5 bg-gray-100 relative overflow-hidden">
            <div
              className={`h-full transition-all ease-out ${
                isDone ? "bg-green-500" : "bg-elca-orange"
              } ${isWaiting ? "animate-pulse-soft" : ""}`}
              style={{
                width: isDone ? "100%" : `${progressPercent}%`,
                transitionDuration: isDone ? "400ms" : "300ms",
              }}
            />
            {isWaiting && (
              <div
                className="absolute inset-0 animate-shimmer"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                }}
              />
            )}
          </div>

          <div className="p-5 sm:p-6">
            {/* 0: EDI BADGE label */}
            <p className={`text-[10px] font-light text-gray-400 tracking-[3px] uppercase mb-3 transition-all ease-out ${vis(0)}`}>
              EDI BADGE
            </p>

            <div className="flex justify-between items-start">
              {/* 1: Name */}
              <h2 className={`text-2xl sm:text-3xl font-bold text-elca-dark leading-tight transition-all ease-out ${vis(1)}`}>
                {truncate(name, 28)}
              </h2>

              {/* 2: Avatar */}
              <div className={`relative w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] shrink-0 ml-4 transition-all ease-out ${vis(2)}`}>
                <div className="w-full h-full rounded-full border-[2.5px] border-elca-orange overflow-hidden">
                  {badgeData.imageLink ? (
                    <img src={badgeData.imageLink} alt="Badge" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-elca-orange/10 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-elca-orange">{initials}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3: Project */}
            <div className={`mt-4 transition-all ease-out ${vis(3)}`}>
              <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">PROJECT</p>
              <p className="text-sm text-elca-dark mt-1">{truncate(badgeData.mainProject || "N/A", 40)}</p>
            </div>

            {/* 4: Dates */}
            <div className={`flex gap-10 mt-4 transition-all ease-out ${vis(4)}`}>
              <div>
                <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">START</p>
                <p className="text-sm text-elca-dark mt-1">{badgeData.startDate || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">COMPLETION</p>
                <p className="text-sm text-elca-dark mt-1">{badgeData.completionDate || "N/A"}</p>
              </div>
            </div>

            {/* 5: Divider */}
            <div className={`my-4 transition-all ease-out ${vis(5)}`}>
              <div
                className="h-px bg-gray-200 transition-all ease-out"
                style={{ width: visibleCount > 5 ? "100%" : "0%", transitionDuration: "400ms" }}
              />
            </div>

            {/* 6: Details */}
            <div className={`transition-all ease-out ${vis(6)}`}>
              <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">DETAILS</p>
              <p className="text-sm text-elca-gray mt-1">{truncate(badgeData.details || "", 80)}</p>
            </div>

            {/* 7: Recipient */}
            <div className={`mt-4 transition-all ease-out ${vis(7)}`}>
              <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">RECIPIENT</p>
              <p className="text-xs font-mono text-elca-dark mt-1">{badgeData.recipientWallet || "N/A"}</p>
            </div>
          </div>

          {/* 8: Footer */}
          <div className={`transition-all ease-out ${vis(8)}`}>
            <div className="bg-elca-dark px-5 sm:px-6 py-3 flex justify-between items-center">
              <span className="text-[11px] font-light text-white tracking-[1px]">{network === "polygon" ? "POLYGON MAINNET" : "POLYGON TESTNET"}</span>
              <span className="text-[11px] font-light text-gray-400">ERC-721</span>
            </div>
          </div>

          {/* 9: Status bar */}
          <div className={`px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 transition-all ease-out ${vis(9)}`}>
            <div className="flex items-center justify-center gap-2">
              {isDone ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" className="w-4 h-4 animate-checkmark">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-xs text-green-600 font-semibold">Badge minted successfully</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full border-2 border-elca-orange/30 border-t-elca-orange animate-spin" />
                  <span className="text-xs text-elca-gray font-medium">
                    {isWaiting ? "Waiting for confirmation..." : "Sending to blockchain..."}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] ${toastFading ? "animate-toast-out" : "animate-toast-in"}`}>
          <div className="px-5 py-3 rounded-full bg-elca-dark/90 backdrop-blur-sm shadow-2xl">
            <p className="text-sm text-white font-medium tracking-wide flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Delivered to {truncateAddress(badgeData.recipientWallet)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
