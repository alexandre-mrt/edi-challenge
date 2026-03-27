import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getReadOnlyContract, getContractAddress, getProvider } from "@/lib/contract";
import type { NetworkType } from "@/lib/types";

export interface BadgeLookupResult {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata: Record<string, unknown> | null;
}

export interface LookupResponse {
  success: boolean;
  data?: {
    query: string;
    queryType: "address" | "tokenId" | "nftAddress";
    network: string;
    contractAddress: string;
    badges: BadgeLookupResult[];
  };
  error?: string;
}

async function fetchMetadata(uri: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(uri, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function lookupByTokenId(
  tokenId: number,
  contract: ethers.BaseContract,
  contractAddress: string,
): Promise<BadgeLookupResult | null> {
  try {
    const owner: string = await contract.getFunction("ownerOf")(tokenId);
    const tokenURI: string = await contract.getFunction("tokenURI")(tokenId);
    const metadata = await fetchMetadata(tokenURI);
    return { tokenId, owner: ethers.getAddress(owner), tokenURI, metadata };
  } catch {
    return null;
  }
}

async function lookupByAddress(
  address: string,
  contract: ethers.BaseContract,
  contractAddress: string,
  provider: ethers.JsonRpcProvider,
): Promise<BadgeLookupResult[]> {
  const normalizedAddress = ethers.getAddress(address);
  const totalSupply = Number(await contract.getFunction("totalSupply")());
  const badges: BadgeLookupResult[] = [];

  // Check each token
  const checkPromises = Array.from({ length: totalSupply }, async (_, i) => {
    try {
      const owner: string = await contract.getFunction("ownerOf")(i);
      if (ethers.getAddress(owner) === normalizedAddress) {
        const tokenURI: string = await contract.getFunction("tokenURI")(i);
        const metadata = await fetchMetadata(tokenURI);
        return { tokenId: i, owner: normalizedAddress, tokenURI, metadata };
      }
    } catch {
      // Token may have been burned
    }
    return null;
  });

  const results = await Promise.all(checkPromises);
  for (const result of results) {
    if (result) badges.push(result);
  }

  // Also check events for badges originally minted to this address
  try {
    const iface = new ethers.Interface([
      "event BadgeMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI)",
    ]);
    const topic0 = iface.getEvent("BadgeMinted")!.topicHash;
    const recipientTopic = ethers.zeroPadValue(normalizedAddress, 32);

    const logs = await provider.getLogs({
      address: contractAddress,
      topics: [topic0, null, recipientTopic],
      fromBlock: 0,
      toBlock: "latest",
    });

    for (const log of logs) {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (!parsed) continue;
      const tokenId = Number(parsed.args[0]);
      if (!badges.some((b) => b.tokenId === tokenId)) {
        const tokenURI = String(parsed.args[2]);
        const metadata = await fetchMetadata(tokenURI);
        let currentOwner = normalizedAddress;
        try {
          currentOwner = ethers.getAddress(
            await contract.getFunction("ownerOf")(tokenId)
          );
        } catch {
          // burned
        }
        badges.push({ tokenId, owner: currentOwner, tokenURI, metadata });
      }
    }
  } catch {
    // Event query may fail
  }

  badges.sort((a, b) => a.tokenId - b.tokenId);
  return badges;
}

export async function GET(request: NextRequest): Promise<NextResponse<LookupResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || searchParams.get("address")?.trim() || "";
    const network = (searchParams.get("network")?.trim() || "amoy") as NetworkType;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Please provide a wallet address or token ID" },
        { status: 400 }
      );
    }

    if (network !== "amoy" && network !== "polygon") {
      return NextResponse.json(
        { success: false, error: "Invalid network" },
        { status: 400 }
      );
    }

    const contract = getReadOnlyContract(network);
    const contractAddress = getContractAddress(network);
    const provider = getProvider(network);

    // Detect query type:
    // - "0x.../3" or "0x.../0" = NFT address (contract/tokenId)
    // - "123" = token ID
    // - "0x..." = wallet address
    const nftAddressMatch = query.match(/^(0x[a-fA-F0-9]{40})\/(\d+)$/);
    const isTokenId = /^\d+$/.test(query);
    const isAddress = ethers.isAddress(query);

    if (!nftAddressMatch && !isTokenId && !isAddress) {
      return NextResponse.json(
        { success: false, error: "Enter a wallet address (0x...), token ID (0, 1, 2...), or NFT address (0x.../tokenId)." },
        { status: 400 }
      );
    }

    let badges: BadgeLookupResult[] = [];
    let queryType: "address" | "tokenId" | "nftAddress" = "address";

    if (nftAddressMatch) {
      // NFT address format: contract/tokenId
      queryType = "nftAddress";
      const badge = await lookupByTokenId(Number(nftAddressMatch[2]), contract, contractAddress);
      if (badge) badges = [badge];
    } else if (isTokenId) {
      queryType = "tokenId";
      const badge = await lookupByTokenId(Number(query), contract, contractAddress);
      if (badge) badges = [badge];
    } else {
      queryType = "address";
      badges = await lookupByAddress(query, contract, contractAddress, provider);
    }

    return NextResponse.json({
      success: true,
      data: {
        query: isAddress ? ethers.getAddress(query) : query,
        queryType,
        network,
        contractAddress,
        badges,
      },
    });
  } catch (error) {
    console.error("Lookup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
