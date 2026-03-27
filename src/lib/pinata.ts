const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

interface PinataUploadResponse {
  readonly IpfsHash: string;
  readonly PinSize: number;
  readonly Timestamp: string;
}

export async function uploadImageToPinata(imageBuffer: Buffer, fileName: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" });
  formData.append("file", blob, fileName);
  formData.append("pinataMetadata", JSON.stringify({ name: fileName }));

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata upload failed: ${error}`);
  }

  const result: PinataUploadResponse = await response.json();
  return `${PINATA_GATEWAY}/${result.IpfsHash}`;
}

export async function uploadMetadataToPinata(
  metadata: Record<string, unknown>,
  name: string
): Promise<string> {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata metadata upload failed: ${error}`);
  }

  const result: PinataUploadResponse = await response.json();
  return `${PINATA_GATEWAY}/${result.IpfsHash}`;
}
