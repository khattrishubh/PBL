# BlockDrive – Decentralized File Storage System

BlockDrive is a secure, decentralized web application for managing and sharing files. By leveraging IPFS for immutable storage and a custom Ethereum smart contract for access control, BlockDrive guarantees mathematically provable ownership and permissions over your data.

## Features
- **Decentralized Storage:** Uploads files to IPFS, ensuring extremely high availability and censorship resistance.
- **Smart Contract Access Control:** Maps cryptographic hashes to user wallets natively on-chain.
- **Secure File Sharing:** Share files with other users via wallet address with cryptographically verified permissions.
- **Modern UI:** Responsive, aesthetically premium dashboard built with React, Vite, and Tailwind CSS.
- **Hybrid Architecture:** Uses a Node/Express backend to orchestrate pinned storage while preserving trustless ownership validation on the blockchain.

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS, TypeScript
- **Backend:** Node.js, Express, MongoDB (for metadata caching)
- **Blockchain:** Solidity, Ethers.js, MetaMask Integration
- **Storage:** IPFS (via Pinata)

## Architecture
1. **Upload Initiation:** User selects a file via the React Frontend.
2. **IPFS Pinning:** The backend temporarily buffers the file and pins it to IPFS, returning a permanent Content Identifier (CID).
3. **On-Chain Registry:** The frontend prompts the user's MetaMask wallet to record the CID ownership onto the BlockDrive smart contract.
4. **Access:** The smart contract natively enforces who can retrieve the CID.

## Setup Instructions

### 1. Smart Contracts
Navigate to the `contracts/` directory to deploy the Solidity contract using Hardhat or Remix. Alternatively, deploy directly from the frontend settings panel if supported.

### 2. Backend Setup
The backend handles API routing and IPFS pinning.
```bash
cd server
npm install
npm run dev
```
*(Ensure you configure the `.env` file inside `server/` with your database and IPFS credentials).*

### 3. Frontend Setup
The frontend serves the user-facing React application.
```bash
cd client
npm install
npm run dev
```

## Deployment Note
The frontend can be efficiently bundled via Vite and hosted statically on **GitHub Pages** (or Vercel). To deploy just the frontend:
```bash
cd client
npm run build
npm run deploy
```
*(Ensure the backend is hosted separately on a provider like Render or Heroku).*

## Author
Developed for secure decentralized file management.
