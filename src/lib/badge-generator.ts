import { BadgeData } from "./types";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}

export function generateBadgeSVG(data: BadgeData, network: "amoy" | "polygon" = "amoy"): string {
  const name = escapeXml(truncate(`${data.firstName} ${data.lastName}`, 30));
  const project = escapeXml(truncate(data.mainProject || "N/A", 35));
  const startDate = escapeXml(data.startDate || "N/A");
  const completionDate = escapeXml(data.completionDate || "N/A");
  const details = escapeXml(truncate(data.details || "", 60));
  const imageLink = data.imageLink || "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F4F4F4;stop-opacity:1" />
    </linearGradient>
    <clipPath id="imgClip">
      <circle cx="500" cy="100" r="60" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="600" height="400" rx="16" fill="url(#bg)" />

  <!-- Top accent bar -->
  <rect width="600" height="6" rx="3" fill="#FF483A" />

  <!-- ELCA branding -->
  <text x="30" y="42" font-family="Montserrat, sans-serif" font-size="12" font-weight="300" fill="#A0A0A0" letter-spacing="2">EDI BADGE</text>

  <!-- Profile image -->
  ${imageLink ? `<image href="${escapeXml(imageLink)}" x="440" y="40" width="120" height="120" clip-path="url(#imgClip)" preserveAspectRatio="xMidYMid slice" />` : `<circle cx="500" cy="100" r="60" fill="#FF483A" opacity="0.15" /><text x="500" y="108" font-family="Montserrat, sans-serif" font-size="24" fill="#FF483A" text-anchor="middle" font-weight="600">${escapeXml(data.firstName.charAt(0))}${escapeXml(data.lastName.charAt(0))}</text>`}
  <circle cx="500" cy="100" r="60" fill="none" stroke="#FF483A" stroke-width="2.5" />

  <!-- Name -->
  <text x="30" y="90" font-family="Montserrat, sans-serif" font-size="28" font-weight="700" fill="#414344">${name}</text>

  <!-- Project -->
  <text x="30" y="125" font-family="Montserrat, sans-serif" font-size="13" font-weight="600" fill="#FF483A" letter-spacing="1">PROJECT</text>
  <text x="30" y="148" font-family="Montserrat, sans-serif" font-size="16" fill="#414344">${project}</text>

  <!-- Dates row -->
  <text x="30" y="185" font-family="Montserrat, sans-serif" font-size="11" font-weight="600" fill="#FF483A" letter-spacing="1">START</text>
  <text x="30" y="205" font-family="Montserrat, sans-serif" font-size="14" fill="#414344">${startDate}</text>

  <text x="200" y="185" font-family="Montserrat, sans-serif" font-size="11" font-weight="600" fill="#FF483A" letter-spacing="1">COMPLETION</text>
  <text x="200" y="205" font-family="Montserrat, sans-serif" font-size="14" fill="#414344">${completionDate}</text>

  <!-- Divider -->
  <line x1="30" y1="225" x2="570" y2="225" stroke="#DCDCDC" stroke-width="1" />

  <!-- Details -->
  <text x="30" y="255" font-family="Montserrat, sans-serif" font-size="11" font-weight="600" fill="#FF483A" letter-spacing="1">DETAILS</text>
  <text x="30" y="278" font-family="Montserrat, sans-serif" font-size="14" fill="#6B7280">${details}</text>

  <!-- Bottom bar -->
  <rect y="360" width="600" height="40" rx="0" fill="#414344" />
  <text x="30" y="385" font-family="Montserrat, sans-serif" font-size="11" font-weight="300" fill="#FFFFFF" letter-spacing="1">${network === "polygon" ? "POLYGON MAINNET" : "POLYGON TESTNET"}</text>
  <text x="570" y="385" font-family="Montserrat, sans-serif" font-size="11" font-weight="300" fill="#A0A0A0" text-anchor="end">ERC-721</text>

  <!-- Corner accent -->
  <rect x="560" y="0" width="40" height="6" rx="3" fill="#FF483A" opacity="0.5" />
</svg>`;
}
