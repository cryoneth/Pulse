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

  // Deploy or reuse MarketFactory
  const existingFactory = process.env.MARKET_FACTORY;
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  let marketFactory;

  if (existingFactory) {
    console.log("Reusing existing MarketFactory at:", existingFactory);
    marketFactory = MarketFactory.attach(existingFactory);
  } else {
    console.log("Deploying MarketFactory with USDC:", usdcAddress);
    marketFactory = await MarketFactory.deploy(usdcAddress);
    await marketFactory.waitForDeployment();
  }

  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("MarketFactory address:", marketFactoryAddress);

  // All 8 markets with real questions and future end dates
  const now = Math.floor(Date.now() / 1000);
  const ONE_WEEK = 7 * 24 * 60 * 60;
  const TWO_WEEKS = 14 * 24 * 60 * 60;
  const ONE_MONTH = 30 * 24 * 60 * 60;
  const THREE_MONTHS = 90 * 24 * 60 * 60;

  const markets = [
    { question: "Will the Lakers win the 2025 NBA Championship?", endTime: now + THREE_MONTHS },
    { question: "Will Taylor Swift announce a new album before July?", endTime: now + THREE_MONTHS },
    { question: "Will Bitcoin hit $150k in 2025?", endTime: now + THREE_MONTHS },
    { question: "Will the Super Bowl LIX have over 120M viewers?", endTime: now + ONE_MONTH },
    { question: "Will a Marvel movie gross $1B+ in 2025?", endTime: now + THREE_MONTHS },
    { question: "Will Ethereum flip Bitcoin in market cap this year?", endTime: now + THREE_MONTHS },
    { question: "Will Drake release a new album in Q1 2025?", endTime: now + TWO_WEEKS },
    { question: "Will the Warriors make the NBA playoffs?", endTime: now + ONE_MONTH },
  ];

  console.log(`\nCreating ${markets.length} markets...\n`);

  for (let i = 0; i < markets.length; i++) {
    const { question, endTime } = markets[i];
    console.log(`Creating market ${i}: "${question}"...`);
    try {
      const tx = await marketFactory.createMarket(question, endTime, {
        gasLimit: 5_000_000,
      });
      const receipt = await tx.wait();
      console.log(`  tx: ${receipt?.hash}`);

      const marketAddress = await marketFactory.markets(i);
      console.log(`  Market ${i}: ${marketAddress}`);
      console.log(`  Ends: ${new Date(endTime * 1000).toISOString()}\n`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}\n`);
    }
  }

  console.log("All markets deployed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
