import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Mock USDC (for testing)
  // Check if we are on a testnet. If we are on Base Sepolia, use real USDC.
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, network.chainId);

  let usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC

  // Base mainnet — real USDC
  if (network.chainId === 8453n) {
    usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet USDC
    console.log("Using Base mainnet USDC:", usdcAddress);
  }
  // If local or unknown network, deploy mock
  else if (network.chainId !== 84532n && network.chainId !== 5042002n) {
     console.log("Deploying Mock USDC...");
     const MockToken = await ethers.getContractFactory("MockERC20"); 
     const mockUsdc = await MockToken.deploy("USD Coin", "USDC");
     await mockUsdc.waitForDeployment();
     usdcAddress = await mockUsdc.getAddress();
     console.log("Mock USDC deployed to:", usdcAddress);
  } else if (network.chainId === 5042002n) {
      // Arc Testnet USDC (Placeholder, verify in docs)
      // If Arc uses native USDC as gas, we might need a wrapped version or just use the address.
      // For now, assuming standard USDC address if available, or deploying mock if not.
      // Arc docs say USDC is Gas. So we need to interact with the "native" token wrapped as ERC20? 
      // Usually "WUSDC" or similar. Or maybe just "USDC". 
      // Let's stick to deploying MockUSDC on Arc for safety unless we know the exact address.
      console.log("Deploying Mock USDC on Arc Testnet for safety...");
      const MockToken = await ethers.getContractFactory("MockERC20"); 
      const mockUsdc = await MockToken.deploy("USD Coin", "USDC");
      await mockUsdc.waitForDeployment();
      usdcAddress = await mockUsdc.getAddress();
      console.log("Mock USDC deployed to:", usdcAddress);
  }

  // 2. Deploy MarketFactory
  console.log("Deploying MarketFactory with USDC:", usdcAddress);
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(usdcAddress);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();

  console.log("MarketFactory deployed to:", marketFactoryAddress);

  // 3. Create a Demo Market
  // Need an end time in the future.
  const oneWeekInSeconds = 7 * 24 * 60 * 60;
  const endTime = Math.floor(Date.now() / 1000) + oneWeekInSeconds;

  console.log("Creating demo market...");
  const tx = await marketFactory.createMarket("Will ETH reach $10k by 2026?", endTime);
  await tx.wait();
  
  // Get the market address
  const marketAddress = await marketFactory.markets(0);
  console.log("Demo Market created at:", marketAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
