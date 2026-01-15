const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", hre.network.name);

  // Check if we need to deploy Mock MNEE (for testnets or local)
  // For mainnet, we would use the real MNEE address
  let mneeAddress;

  // You might want to hardcode the address if you already have one on the network
  // const EXISTING_MNEE_ADDRESS = "0x..."; 

  if (hre.network.name === "cronos_testnet" || hre.network.name === "hardhat" || hre.network.name === "localhost") {
    console.log("\n📝 Deploying MockMNEE to Cronos Testnet...");
    const MockMNEE = await hre.ethers.getContractFactory("MockMNEE");
    const mockMNEE = await MockMNEE.deploy();
    await mockMNEE.waitForDeployment();
    mneeAddress = await mockMNEE.getAddress();
    console.log("✅ MockMNEE deployed to:", mneeAddress);
    console.log("   View on Cronos Explorer: https://explorer.cronos.org/testnet/address/" + mneeAddress);
  } else {
    // Setup for other networks or throw error if address not provided
    throw new Error("MNEE token address required for this network");
  }

  console.log("\n📝 Deploying FlowPayStream to Cronos Testnet...");
  console.log("   Using MNEE address:", mneeAddress);
  const FlowPayStream = await hre.ethers.getContractFactory("FlowPayStream");
  const flowPayStream = await FlowPayStream.deploy(mneeAddress);

  await flowPayStream.waitForDeployment();

  const flowPayAddress = await flowPayStream.getAddress();
  console.log("✅ FlowPayStream deployed to:", flowPayAddress);
  console.log("   View on Cronos Explorer: https://explorer.cronos.org/testnet/address/" + flowPayAddress);
  
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Update your .env file with these addresses:");
  console.log("   MNEE_CONTRACT=" + mneeAddress);
  console.log("   FLOWPAY_CONTRACT=" + flowPayAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });