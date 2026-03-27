"use client";

import { useRef, useState, useCallback } from "react";
import type { JSX } from "react";
import { BadgeData } from "@/lib/types";

interface BadgePreviewProps {
  data: BadgeData;
  network?: "amoy" | "polygon";
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}

const MAX_ROTATION = 15; // degrees
const SHINE_SIZE = 300; // px

export default function BadgePreview({ data, network = "amoy" }: BadgePreviewProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, shineX: 50, shineY: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalize to -1 to 1
    const normalX = (x - centerX) / centerX;
    const normalY = (y - centerY) / centerY;

    setTilt({
      rotateX: -normalY * MAX_ROTATION,
      rotateY: normalX * MAX_ROTATION,
      shineX: (x / rect.width) * 100,
      shineY: (y / rect.height) * 100,
    });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ rotateX: 0, rotateY: 0, shineX: 50, shineY: 50 });
  }, []);

  const name = `${data.firstName || "First"} ${data.lastName || "Last"}`;
  const initials = `${(data.firstName || "F").charAt(0)}${(data.lastName || "L").charAt(0)}`;

  return (
    <div
      className="w-full max-w-[600px] mx-auto"
      style={{ perspective: "1000px" }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="aspect-[3/2] rounded-2xl overflow-hidden border border-gray-100 relative will-change-transform"
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(${isHovering ? 30 : 0}px)`,
          transition: isHovering ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
          boxShadow: isHovering
            ? `0 ${20 + tilt.rotateX}px ${40 + Math.abs(tilt.rotateX)}px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,72,58,0.1)`
            : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-elca-light" />

        {/* Shine overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
          style={{
            background: isHovering
              ? `radial-gradient(${SHINE_SIZE}px circle at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,0.25), transparent 60%)`
              : "none",
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Edge highlight */}
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
          style={{
            boxShadow: isHovering
              ? "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.05)"
              : "none",
          }}
        />

        {/* Card content */}
        <div className="relative z-0 h-full flex flex-col">
          {/* Top accent */}
          <div className="h-1.5 bg-elca-orange" />

          <div className="p-4 sm:p-6 pt-4 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-light text-gray-400 tracking-[2px] uppercase mb-4">
                  EDI BADGE
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-elca-dark leading-tight truncate">
                  {truncate(name, 30)}
                </h2>
              </div>

              {/* Avatar */}
              <div className="relative w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] -mt-2 shrink-0 ml-3">
                <div className="w-full h-full rounded-full border-[2.5px] border-elca-orange overflow-hidden">
                  {data.imageLink ? (
                    <img
                      src={data.imageLink}
                      alt="Badge"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full rounded-full bg-elca-orange/15 flex items-center justify-center ${data.imageLink ? "hidden" : ""}`}
                  >
                    <span className="text-xl sm:text-2xl font-semibold text-elca-orange">
                      {initials}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project */}
            <div className="mt-2">
              <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">
                PROJECT
              </p>
              <p className="text-sm text-elca-dark mt-1">
                {truncate(data.mainProject || "N/A", 35)}
              </p>
            </div>

            {/* Dates */}
            <div className="flex gap-6 sm:gap-12 mt-4">
              <div>
                <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">
                  START
                </p>
                <p className="text-sm text-elca-dark mt-1">
                  {data.startDate || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">
                  COMPLETION
                </p>
                <p className="text-sm text-elca-dark mt-1">
                  {data.completionDate || "N/A"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3" />

            {/* Details */}
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase">
                DETAILS
              </p>
              <p className="text-sm text-elca-gray mt-1">
                {truncate(data.details || "", 60)}
              </p>
            </div>

            {/* Footer */}
            <div className="bg-elca-dark -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 flex justify-between items-center">
              <span className="text-[11px] font-light text-white tracking-[1px]">
                {network === "polygon" ? "POLYGON MAINNET" : "POLYGON TESTNET"}
              </span>
              <span className="text-[11px] font-light text-gray-400">
                ERC-721
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
