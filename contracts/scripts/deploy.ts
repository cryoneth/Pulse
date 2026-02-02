import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, network.chainId);

  let usdcAddress: string;

  if (network.chainId === 8453n) {
    // Base mainnet — real USDC
    usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    console.log("Using Base mainnet USDC:", usdcAddress);
  } else {
    // Local or unknown network — deploy mock USDC
    console.log("Deploying Mock USDC...");
    const MockToken = await ethers.getContractFactory("MockERC20");
    const mockUsdc = await MockToken.deploy("USD Coin", "USDC");
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log("Mock USDC deployed to:", usdcAddress);
  }

  // Deploy MarketFactory
  console.log("Deploying MarketFactory with USDC:", usdcAddress);
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(usdcAddress);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();

  console.log("MarketFactory deployed to:", marketFactoryAddress);

  // Create a Demo Market
  const oneWeekInSeconds = 7 * 24 * 60 * 60;
  const endTime = Math.floor(Date.now() / 1000) + oneWeekInSeconds;

  console.log("Creating demo market...");
  const tx = await marketFactory.createMarket("Will ETH reach $10k by 2026?", endTime);
  await tx.wait();

  const marketAddress = await marketFactory.markets(0);
  console.log("Demo Market created at:", marketAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
