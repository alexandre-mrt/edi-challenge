import { ethers } from "ethers";
import type { NetworkType } from "./types";

const CONTRACT_ABI = [
  "function mintBadge(address to, string memory uri) public returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "event BadgeMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI)",
] as const;

interface MintBadgeResult {
  readonly tokenId: number;
  readonly txHash: string;
}

const CHAIN_IDS: Record<NetworkType, number> = {
  amoy: 80002,
  polygon: 137,
};

// Fixed gas price for testnet, dynamic for mainnet
const FIXED_GAS_PRICE: Record<NetworkType, bigint | null> = {
  amoy: ethers.parseUnits("30", "gwei"),
  polygon: null, // use dynamic estimation on mainnet
};

export function getProvider(network: NetworkType): ethers.JsonRpcProvider {
  const rpcUrl = (
    network === "amoy"
      ? process.env.NEXT_PUBLIC_AMOY_RPC
      : process.env.NEXT_PUBLIC_POLYGON_RPC
  )?.trim();

  if (!rpcUrl) throw new Error(`Missing RPC URL for ${network}`);

  // Use staticNetwork to completely disable ENS lookups
  const staticNetwork = ethers.Network.from(CHAIN_IDS[network]);
  return new ethers.JsonRpcProvider(rpcUrl, staticNetwork, {
    staticNetwork,
  });
}

export function getContractAddress(network: NetworkType): string {
  const address = (
    network === "amoy"
      ? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_AMOY
      : process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET
  )?.trim();

  if (!address) throw new Error(`Missing contract address for ${network}`);
  return ethers.getAddress(address);
}

export function getSigner(network: NetworkType): ethers.Wallet {
  const provider = getProvider(network);
  const privateKey = process.env.PRIVATE_KEY?.trim();
  if (!privateKey) throw new Error("Missing PRIVATE_KEY");
  return new ethers.Wallet(`0x${privateKey}`, provider);
}

export function getContract(network: NetworkType): ethers.BaseContract {
  const signer = getSigner(network);
  const address = getContractAddress(network);
  return new ethers.Contract(address, CONTRACT_ABI, signer);
}

export function getReadOnlyContract(network: NetworkType): ethers.BaseContract {
  const provider = getProvider(network);
  const address = getContractAddress(network);
  return new ethers.Contract(address, CONTRACT_ABI, provider);
}

export async function mintBadge(
  recipientAddress: string,
  metadataURI: string,
  network: NetworkType
): Promise<MintBadgeResult> {
  const contract = getContract(network);

  // Normalize the recipient address to prevent ENS resolution attempts
  const normalizedRecipient = ethers.getAddress(recipientAddress.trim());

  const txOptions: Record<string, unknown> = { gasLimit: 250_000 };
  const fixedPrice = FIXED_GAS_PRICE[network];
  if (fixedPrice) {
    txOptions.gasPrice = fixedPrice;
  }

  const tx = await contract.getFunction("mintBadge")(normalizedRecipient, metadataURI, txOptions);
  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error("Transaction receipt not available");
  }

  const badgeMintedLog = receipt.logs.find(
    (log: ethers.Log): boolean => {
      try {
        const parsed = contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
        return parsed?.name === "BadgeMinted";
      } catch {
        return false;
      }
    }
  );

  let tokenId = 0;
  if (badgeMintedLog) {
    const parsed = contract.interface.parseLog({
      topics: [...badgeMintedLog.topics],
      data: badgeMintedLog.data,
    });
    tokenId = Number(parsed?.args[0] ?? 0);
  }

  return { tokenId, txHash: receipt.hash };
}
