"use client";

import type { JSX } from "react";
import { NetworkType } from "@/lib/types";

interface NetworkSwitchProps {
  network: NetworkType;
  onChange: (network: NetworkType) => void;
}

export default function NetworkSwitch({ network, onChange }: NetworkSwitchProps): JSX.Element {
  return (
    <div className="flex items-center gap-3 bg-elca-light rounded-full p-1">
      <button
        onClick={() => onChange("amoy")}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
          network === "amoy"
            ? "bg-elca-orange text-white shadow-sm"
            : "text-elca-gray hover:text-elca-dark"
        }`}
      >
        Amoy Testnet
      </button>
      <button
        onClick={() => onChange("polygon")}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
          network === "polygon"
            ? "bg-elca-orange text-white shadow-sm"
            : "text-elca-gray hover:text-elca-dark"
        }`}
      >
        Polygon Mainnet
      </button>
    </div>
  );
}
