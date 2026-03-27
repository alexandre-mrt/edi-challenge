"use client";

import type { JSX } from "react";
import { BadgeData } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";

type MintPhase = "idle" | "drawing" | "confirmed" | "done";

interface BadgeFormProps {
  readonly data: BadgeData;
  readonly onChange: (data: BadgeData) => void;
  readonly onMint: () => void;
  readonly isMinting: boolean;
  readonly mintPhase: MintPhase;
}

export default function BadgeForm({ data, onChange, onMint, isMinting, mintPhase }: BadgeFormProps): JSX.Element {
  const update = (field: keyof BadgeData, value: string): void => {
    onChange({ ...data, [field]: value });
  };

  const isValid = data.firstName && data.lastName && data.recipientWallet;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-elca-dark tracking-wide uppercase">
        Badge Metadata
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="First Name"
          value={data.firstName}
          onChange={(v) => update("firstName", v)}
          placeholder="John"
          required
        />
        <Field
          label="Last Name"
          value={data.lastName}
          onChange={(v) => update("lastName", v)}
          placeholder="Doe"
          required
        />
      </div>

      <Field
        label="Main Project"
        value={data.mainProject}
        onChange={(v) => update("mainProject", v)}
        placeholder="EDI Challenge"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Start Date"
          value={data.startDate}
          onChange={(v) => update("startDate", v)}
          type="date"
        />
        <Field
          label="Completion Date"
          value={data.completionDate}
          onChange={(v) => update("completionDate", v)}
          type="date"
        />
      </div>

      <Field
        label="Details"
        value={data.details}
        onChange={(v) => update("details", v)}
        placeholder="A brief description..."
        multiline
      />

      <ImageUpload
        value={data.imageLink}
        onChange={(v) => update("imageLink", v)}
      />

      <Field
        label="Recipient Wallet"
        value={data.recipientWallet}
        onChange={(v) => update("recipientWallet", v)}
        placeholder="0x..."
        required
      />

      <button
        onClick={onMint}
        disabled={!isValid || isMinting}
        className={`w-full py-3.5 rounded-full bg-elca-orange text-white font-semibold text-sm tracking-wide uppercase transition-all hover:bg-elca-orange-dark disabled:opacity-40 disabled:cursor-not-allowed ${
          isValid && !isMinting ? "animate-pulse-soft" : ""
        }`}
      >
        {mintPhase === "drawing" || mintPhase === "confirmed" ? (
          <span className="flex items-center justify-center gap-2">
            {mintPhase === "drawing" ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Minting...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 animate-checkmark">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Confirmed
              </>
            )}
          </span>
        ) : (
          "Mint Badge"
        )}
      </button>
    </div>
  );
}

interface FieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly type?: string;
  readonly required?: boolean;
  readonly multiline?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  multiline = false,
}: FieldProps): JSX.Element {
  const baseClasses =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-elca-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-elca-orange/30 focus:border-elca-orange transition-all duration-200";

  return (
    <div>
      <label className="block text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase mb-1.5">
        {label}
        {required && <span className="text-elca-orange ml-0.5">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={baseClasses + " resize-none"}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  );
}
