export interface BadgeData {
  firstName: string;
  lastName: string;
  mainProject: string;
  startDate: string;
  completionDate: string;
  details: string;
  imageLink: string;
  recipientWallet: string;
}

export type NetworkType = "amoy" | "polygon";

export interface MintResponse {
  success: boolean;
  data?: {
    tokenId: number;
    txHash: string;
    contractAddress: string;
    metadataURI: string;
    explorerUrl: string;
  };
  error?: string;
}
