import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { BadgeData, MintResponse, NetworkType } from "@/lib/types";
import { generateBadgeSVG } from "@/lib/badge-generator";
import { uploadImageToPinata, uploadMetadataToPinata } from "@/lib/pinata";
import { mintBadge, getContractAddress } from "@/lib/contract";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeBadgeInput } from "@/lib/sanitize";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest): Promise<NextResponse<MintResponse>> {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfterSeconds),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await request.json();
    const { badgeData, network = "amoy" } = body as {
      badgeData: Record<string, unknown>;
      network: NetworkType;
    };

    // Validate network
    if (network !== "amoy" && network !== "polygon") {
      return NextResponse.json(
        { success: false, error: "Invalid network. Must be 'amoy' or 'polygon'." },
        { status: 400 }
      );
    }

    // Input sanitization
    const sanitizeResult = sanitizeBadgeInput(badgeData);
    if (!sanitizeResult.valid || !sanitizeResult.sanitized) {
      return NextResponse.json(
        { success: false, error: sanitizeResult.error ?? "Invalid input" },
        { status: 400 }
      );
    }

    const sanitized = sanitizeResult.sanitized;

    // Double-check wallet with ethers
    if (!ethers.isAddress(sanitized.recipientWallet)) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient wallet address" },
        { status: 400 }
      );
    }

    const badgeDataClean: BadgeData = {
      firstName: sanitized.firstName,
      lastName: sanitized.lastName,
      mainProject: sanitized.mainProject,
      startDate: sanitized.startDate,
      completionDate: sanitized.completionDate,
      details: sanitized.details,
      imageLink: sanitized.imageLink,
      recipientWallet: sanitized.recipientWallet,
    };

    // 1. If imageLink is a data URL, upload the image to Pinata
    let resolvedImageUrl = badgeDataClean.imageLink;
    if (badgeDataClean.imageLink.startsWith("data:")) {
      const base64Match = badgeDataClean.imageLink.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        const imageBuffer = Buffer.from(base64Match[1], "base64");
        const photoFileName = `edi-photo-${badgeDataClean.firstName}-${badgeDataClean.lastName}-${Date.now()}.png`;
        resolvedImageUrl = await uploadImageToPinata(imageBuffer, photoFileName);
      }
    }

    // 2. Generate badge SVG (uses resolved image URL)
    const badgeDataWithResolvedImage = { ...badgeDataClean, imageLink: resolvedImageUrl };
    const svg = generateBadgeSVG(badgeDataWithResolvedImage, network);

    // 3. Convert SVG to buffer and upload to Pinata
    const svgBuffer = Buffer.from(svg, "utf-8");
    const fileName = `edi-badge-${badgeDataClean.firstName}-${badgeDataClean.lastName}-${Date.now()}.svg`;

    // 4. Upload badge SVG to Pinata
    const imageUrl = await uploadImageToPinata(svgBuffer, fileName);

    // 5. Create ERC-721 metadata
    const metadata = {
      name: `EDI Badge — ${badgeDataClean.firstName} ${badgeDataClean.lastName}`,
      description: `Badge for ${badgeDataClean.firstName} ${badgeDataClean.lastName} | Project: ${badgeDataClean.mainProject} | ${badgeDataClean.details}`,
      image: imageUrl,
      attributes: [
        { trait_type: "First Name", value: badgeDataClean.firstName },
        { trait_type: "Last Name", value: badgeDataClean.lastName },
        { trait_type: "Main Project", value: badgeDataClean.mainProject },
        { trait_type: "Start Date", value: badgeDataClean.startDate },
        { trait_type: "Completion Date", value: badgeDataClean.completionDate },
        { trait_type: "Details", value: badgeDataClean.details },
        { trait_type: "Photo URL", value: resolvedImageUrl },
      ],
    };

    // 6. Upload metadata to Pinata
    const metadataName = `edi-badge-metadata-${Date.now()}`;
    const metadataURI = await uploadMetadataToPinata(metadata, metadataName);

    // 7. Mint NFT on-chain
    const { tokenId, txHash } = await mintBadge(
      badgeDataClean.recipientWallet,
      metadataURI,
      network
    );

    const explorerBase = network === "amoy"
      ? "https://amoy.polygonscan.com"
      : "https://polygonscan.com";

    return NextResponse.json(
      {
        success: true,
        data: {
          tokenId,
          txHash,
          contractAddress: getContractAddress(network),
          metadataURI,
          explorerUrl: `${explorerBase}/tx/${txHash}`,
        },
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Mint error:", error);
    const message = error instanceof Error ? error.message : "Unknown error during minting";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
