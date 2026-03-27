# EDI Badge Protocol

A public web application that mints ERC-721 NFT badges on Polygon. Users fill a form, preview their badge in real-time, and mint it to any wallet address. No wallet connection or login required.

Built for the **EDI Challenge 2026** at ELCA Digital Innovation.

**Live**: [edi-challenge.vercel.app](https://edi-challenge.vercel.app)

## Features

- **Badge form** with live preview (First Name, Last Name, Project, Dates, Details, Image, Recipient)
- **Image upload** with circular crop or URL input
- **3D tilt effect** on badge cards (mouse-tracking perspective)
- **Minting animation** with progressive badge reveal and confirmation feedback
- **Badge lookup** by wallet address, token ID, or NFT address (`contract/tokenId`)
- **Network toggle** between Polygon Amoy Testnet and Mainnet
- **Server-side minting** (sponsored transactions, no wallet needed)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), Tailwind CSS 4, TypeScript |
| Smart Contract | Solidity 0.8.24, OpenZeppelin ERC-721, Hardhat 2 |
| Storage | Pinata (IPFS) for images and metadata |
| Blockchain | Polygon Amoy Testnet + Polygon Mainnet |
| Hosting | Vercel (frontend + API routes) |
| Package Manager | Bun |

## Architecture

```
                        ┌─────────────────────┐
                        │    User (Browser)    │
                        │                      │
                        │  Form → Live Preview │
                        │  Click "Mint Badge"  │
                        └──────────┬───────────┘
                                   │
                          POST /api/mint
                                   │
                        ┌──────────▼───────────┐
                        │   Vercel API Route    │
                        │   (Server-Side Only)  │
                        │                       │
                        │  1. Validate input     │
                        │  2. Rate limit (5/h)   │
                        │  3. Generate badge SVG │
                        └───┬──────────────┬────┘
                            │              │
                   ┌────────▼──────┐  ┌────▼───────────────┐
                   │  Pinata IPFS  │  │  Polygon Network   │
                   │               │  │                    │
                   │ Upload SVG    │  │ mintBadge(to, uri) │
                   │ Upload JSON   │  │ ERC-721 transfer   │
                   │               │  │                    │
                   │ Returns CID   │  │ Returns tx hash    │
                   └───────────────┘  └────────────────────┘
```

## Sponsored Transactions

The app uses **server-side minting** so end users never need a crypto wallet or tokens.

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│   End User   │────▶│  Vercel Server   │────▶│   Polygon RPC  │
│  (no wallet) │     │  (holds key)     │     │   (blockchain) │
│              │     │                  │     │                │
│  Fills form  │     │  Signs tx with   │     │  Executes      │
│  Clicks mint │     │  server wallet   │     │  mintBadge()   │
│              │     │  Pays gas fees   │     │  Mints NFT     │
└─────────────┘     └──────────────────┘     └────────────────┘

Key security: Private key is a Vercel server-side env var.
Never exposed to the browser (no NEXT_PUBLIC_ prefix).
```

## IPFS Image Resolution

Badge images and metadata are stored permanently on IPFS via Pinata.

```
Mint Flow:
                                         ┌──────────────┐
  Form Data ──▶ Generate SVG ──▶ Upload ──▶│  Pinata IPFS │
                                         │              │
                                         │  badge.svg   │──▶ ipfs://Qm...abc
                                         │  meta.json   │──▶ ipfs://Qm...xyz
                                         └──────────────┘
                                                │
  ERC-721 tokenURI ─────────────────────────────┘
        │
        ▼
  When resolving the NFT:
  1. Read tokenURI from contract → returns IPFS gateway URL
  2. Fetch metadata JSON from IPFS → contains "image" field
  3. Fetch badge SVG from IPFS → renders the visual badge
  4. Display in browser or marketplace (OpenSea, etc.)
```

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Fill in: PRIVATE_KEY, ALCHEMY_API_KEY, PINATA_JWT

# Run development server
bun dev

# Compile smart contract
npx hardhat compile --config hardhat.config.cjs

# Deploy to Polygon Amoy
bun run deploy:amoy

# Deploy to Polygon Mainnet
bun run deploy:mainnet

# Build for production
bun run build
```

## Smart Contract

`EDIBadge.sol` — Minimal ERC-721 with a single `mintBadge(address to, string uri)` function, restricted to the contract owner via OpenZeppelin's `Ownable`.

| Network | Contract Address |
|---------|-----------------|
| Amoy Testnet | `0x501527ad3c9Ae6b4C1E0d8EDCE8c97B2e8d3B64e` |
| Polygon Mainnet | `0x44e377a40982E6977B4998Adc02C08AE6BB03791` |

## Security

- **Private key**: Server-side only (Vercel env var, no `NEXT_PUBLIC_` prefix)
- **Rate limiting**: 5 mints per IP per hour
- **Input sanitization**: HTML stripping, length limits, regex validation
- **Security headers**: X-Content-Type-Options, X-Frame-Options, CSP
- **SVG XSS prevention**: All user input escaped via `escapeXml()`
