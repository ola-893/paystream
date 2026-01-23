const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", hre.network.name);

  // Get deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "TCRO");

  console.log("\n📝 Deploying PayStreamStream to Cronos Testnet...");
  const PayStreamStream = await hre.ethers.getContractFactory("PayStreamStream");
  const payStreamStream = await PayStreamStream.deploy();

  await payStreamStream.waitForDeployment();

  const payStreamAddress = await payStreamStream.getAddress();
  console.log("✅ PayStreamStream deployed to:", payStreamAddress);
  console.log("   View on Cronos Explorer: https://explorer.cronos.org/testnet/address/" + payStreamAddress);

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Update your .env file with this address:");
  console.log("   PAYSTREAM_CONTRACT=" + payStreamAddress);
  console.log("\n💡 Note: PayStream now uses native TCRO instead of token contracts.");
  console.log("   Get TCRO from: https://cronos.org/faucet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });