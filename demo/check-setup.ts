/**
 * Quick setup verification script
 * Run: npx ts-node demo/check-setup.ts
 */
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const FLOWPAYSTREAM_ADDRESS = process.env.FLOWPAY_CONTRACT || '0x155A00fBE3D290a8935ca4Bf5244283685Bb0035';
const CRONOS_RPC_URL = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';

async function checkSetup() {
    console.log("🔍 FlowPay Demo Setup Check\n");

    // 1. Check environment variables
    console.log("1️⃣  Environment Variables:");
    const privateKey = process.env.PRIVATE_KEY_1 || process.env.PRIVATE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (privateKey) {
        console.log("   ✅ PRIVATE_KEY: Found");
    } else {
        console.log("   ❌ PRIVATE_KEY: Missing - Add to .env file");
    }

    if (geminiKey) {
        console.log("   ✅ GEMINI_API_KEY: Found");
    } else {
        console.log("   ⚠️  GEMINI_API_KEY: Missing - AI features will use fallback heuristics");
    }

    if (!privateKey) {
        console.log("\n❌ Cannot continue without PRIVATE_KEY");
        return;
    }

    // 2. Check network connection
    console.log("\n2️⃣  Network Connection:");
    try {
        const provider = new ethers.JsonRpcProvider(CRONOS_RPC_URL);
        const network = await provider.getNetwork();
        console.log(`   ✅ Connected to: Cronos Testnet (chainId: ${network.chainId})`);
    } catch (e: any) {
        console.log(`   ❌ Failed to connect: ${e.message}`);
        return;
    }

    // 3. Check wallet
    console.log("\n3️⃣  Wallet:");
    const provider = new ethers.JsonRpcProvider(CRONOS_RPC_URL);
    const wallet = new ethers.Wallet(
        privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
        provider
    );
    console.log(`   📍 Address: ${wallet.address}`);

    // 4. Check TCRO balance (native currency for gas and payments)
    const tcroBalance = await provider.getBalance(wallet.address);
    console.log(`   💰 TCRO Balance: ${ethers.formatEther(tcroBalance)} TCRO`);
    if (tcroBalance < ethers.parseEther("0.1")) {
        console.log("   ⚠️  Low TCRO balance - Get TCRO from: https://cronos.org/faucet");
    }

    // 5. Check contract exists
    console.log("\n4️⃣  Contract:");
    const flowPayStreamCode = await provider.getCode(FLOWPAYSTREAM_ADDRESS);

    if (flowPayStreamCode !== '0x') {
        console.log(`   ✅ FlowPayStream: ${FLOWPAYSTREAM_ADDRESS}`);
    } else {
        console.log(`   ❌ FlowPayStream not deployed at ${FLOWPAYSTREAM_ADDRESS}`);
        console.log("      Deploy with: npm run deploy:cronos");
    }

    console.log("\n✅ Setup check complete!");
    console.log("\n💡 Note: FlowPay uses native TCRO for payments (no ERC-20 token needed)");
    console.log("\nTo run the demo:");
    console.log("   Terminal 1: npx ts-node demo/provider.ts");
    console.log("   Terminal 2: npx ts-node demo/consumer.ts");
}

checkSetup().catch(console.error);
