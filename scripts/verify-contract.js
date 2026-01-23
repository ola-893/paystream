const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying PayStream Contract on Cronos Testnet\n");

  const PAYSTREAM_ADDRESS = process.env.PAYSTREAM_CONTRACT;
  
  if (!PAYSTREAM_ADDRESS) {
    throw new Error("Missing PAYSTREAM_CONTRACT in .env");
  }

  console.log(`Contract Address: ${PAYSTREAM_ADDRESS}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${hre.network.config.chainId}\n`);

  // Check if contract exists
  const code = await ethers.provider.getCode(PAYSTREAM_ADDRESS);
  console.log(`Contract code length: ${code.length} characters`);
  
  if (code === '0x') {
    console.log("❌ No contract found at this address!");
    return;
  }
  
  console.log("✅ Contract exists at this address");

  // Try to get contract instance
  try {
    const payStream = await ethers.getContractAt("PayStreamStream", PAYSTREAM_ADDRESS);
    console.log("✅ Contract ABI matches");
    
    // Try calling a simple view function
    const isActive = await payStream.isStreamActive(1);
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