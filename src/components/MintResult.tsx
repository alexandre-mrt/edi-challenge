"use client";

import type { JSX } from "react";
import Link from "next/link";
import { MintResponse } from "@/lib/types";

interface MintResultProps {
  result: MintResponse;
  network: "amoy" | "polygon";
  onReset: () => void;
}

export default function MintResult({ result, network, onReset }: MintResultProps): JSX.Element {
  if (!result.success) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 animate-slide-in-up">
        <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide">
          Minting Failed
        </h3>
        <p className="text-sm text-red-600 mt-2">{result.error}</p>
        <button
          onClick={onReset}
          className="mt-4 px-6 py-2 rounded-full bg-elca-dark text-white text-xs font-semibold tracking-wide hover:bg-elca-dark/80 transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { tokenId, txHash, contractAddress, explorerUrl } = result.data!;
  const explorerBase = network === "amoy" ? "https://amoy.polygonscan.com" : "https://polygonscan.com";
  const nftUrl = `${explorerBase}/nft/${contractAddress}/${tokenId}`;

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-4 animate-slide-in-up">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide">
          Badge Minted Successfully
        </h3>
      </div>

      <div className="space-y-3 text-sm">
        <InfoRow label="NFT Address" value={`${contractAddress}/${tokenId}`} mono />
        <InfoRow label="Tx Hash" value={txHash} mono />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href={nftUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 rounded-full bg-elca-orange text-white text-xs font-semibold tracking-wide hover:bg-elca-orange-dark transition-all duration-200"
        >
          View NFT on PolygonScan
        </a>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 rounded-full border border-elca-orange text-elca-orange text-xs font-semibold tracking-wide hover:bg-elca-orange hover:text-white transition-all duration-200"
        >
          View Transaction
        </a>
        <Link
          href={`/lookup?q=${contractAddress}/${tokenId}`}
          className="px-6 py-2.5 rounded-full border border-elca-dark text-elca-dark text-xs font-semibold tracking-wide hover:bg-elca-dark hover:text-white transition-all duration-200"
        >
          View in Lookup
        </Link>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-full border border-gray-300 text-elca-gray text-xs font-semibold tracking-wide hover:bg-gray-100 transition-all duration-200"
        >
          Mint Another
        </button>
      </div>
    </div>
  );
}

interface InfoRowProps {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}

function InfoRow({ label, value, mono }: InfoRowProps): JSX.Element {
  return (
    <div>
      <span className="text-[10px] font-semibold text-green-700 tracking-[1px] uppercase">
        {label}
      </span>
      <p className={`text-green-900 mt-0.5 break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
