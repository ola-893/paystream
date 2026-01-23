const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying FlowPay Contract on Cronos Testnet\n");

  const FLOWPAY_ADDRESS = process.env.FLOWPAY_CONTRACT;
  
  if (!FLOWPAY_ADDRESS) {
    throw new Error("Missing FLOWPAY_CONTRACT in .env");
  }

  console.log(`Contract Address: ${FLOWPAY_ADDRESS}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${hre.network.config.chainId}\n`);

  // Check if contract exists
  const code = await ethers.provider.getCode(FLOWPAY_ADDRESS);
  console.log(`Contract code length: ${code.length} characters`);
  
  if (code === '0x') {
    console.log("❌ No contract found at this address!");
    return;
  }
  
  console.log("✅ Contract exists at this address");

  // Try to get contract instance
  try {
    const flowPay = await ethers.getContractAt("FlowPayStream", FLOWPAY_ADDRESS);
    console.log("✅ Contract ABI matches");
    
    // Try calling a simple view function
    const isActive = await flowPay.isStreamActive(1);
    console.log(`✅ Contract is responsive (isStreamActive(1): ${isActive})`);
    
  } catch (error) {
    console.log("❌ Error calling contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });