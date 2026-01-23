const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", hre.network.name);

  // Get deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "TCRO");

  console.log("\n📝 Deploying FlowPayStream to Cronos Testnet...");
  const FlowPayStream = await hre.ethers.getContractFactory("FlowPayStream");
  const flowPayStream = await FlowPayStream.deploy();

  await flowPayStream.waitForDeployment();

  const flowPayAddress = await flowPayStream.getAddress();
  console.log("✅ FlowPayStream deployed to:", flowPayAddress);
  console.log("   View on Cronos Explorer: https://explorer.cronos.org/testnet/address/" + flowPayAddress);

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Update your .env file with this address:");
  console.log("   FLOWPAY_CONTRACT=" + flowPayAddress);
  console.log("\n💡 Note: FlowPay now uses native TCRO instead of token contracts.");
  console.log("   Get TCRO from: https://cronos.org/faucet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });