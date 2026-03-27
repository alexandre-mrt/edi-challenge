const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log(`Deploying EDIBadge to ${network}...`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} POL`);

  const EDIBadge = await hre.ethers.getContractFactory("EDIBadge");
  const badge = await EDIBadge.deploy();
  await badge.waitForDeployment();

  const address = await badge.getAddress();
  console.log(`EDIBadge deployed to: ${address}`);
  console.log(`\nSet this in .env.local:`);

  if (network === "amoy") {
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_AMOY=${address}`);
    console.log(`\nVerify: https://amoy.polygonscan.com/address/${address}`);
  } else {
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=${address}`);
    console.log(`\nVerify: https://polygonscan.com/address/${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
