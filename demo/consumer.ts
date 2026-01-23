import { FlowPaySDK } from '../sdk/src/FlowPaySDK';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Contract address on Cronos Testnet
const FLOWPAYSTREAM_ADDRESS = process.env.FLOWPAY_CONTRACT || '0x155A00fBE3D290a8935ca4Bf5244283685Bb0035';
// Cronos Testnet RPC
const CRONOS_RPC_URL = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';

/**
 * Demo Consumer: "The AI Agent Application"
 * 
 * This demonstrates an AI agent that:
 * 1. Connects to Cronos testnet with a real wallet
 * 2. Automatically negotiates x402 payments
 * 3. Creates native TCRO payment streams on-chain
 * 4. Accesses premium API content
 */
async function runDemo() {
    console.log("🚀 Starting FlowPay Demo Consumer (Real Blockchain Mode)...\n");

    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY_1 || process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY or PRIVATE_KEY_1 not found in .env file");
    }

    // Verify Gemini API key is available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        console.warn("⚠️  GEMINI_API_KEY not found - AI decision features will be limited");
    }

    // 1. Initialize SDK with Cronos Testnet configuration
    console.log("📡 Connecting to Cronos testnet...");
    const sdk = new FlowPaySDK({
        privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
        rpcUrl: CRONOS_RPC_URL,
        agentId: 'Demo-Consumer-Agent-v1',
        spendingLimits: {
            dailyLimit: ethers.parseEther("100"),  // 100 TCRO daily limit
            totalLimit: ethers.parseEther("1000") // 1000 TCRO total limit
        }
    });

    // Get wallet address
    const provider = new ethers.JsonRpcProvider(CRONOS_RPC_URL);
    const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`, provider);
    console.log(`✅ Agent Wallet: ${wallet.address}`);

    // 2. Check native TCRO balance before starting
    console.log("\n--- Checking TCRO Balance ---");
    let balance = await provider.getBalance(wallet.address);
    console.log(`💰 Current TCRO Balance: ${ethers.formatEther(balance)} TCRO`);

    if (balance < ethers.parseEther("0.1")) {
        console.log("\n⚠️  Low TCRO balance detected!");
        console.log("   Get TCRO from faucet: https://cronos.org/faucet");
        console.log("   You need TCRO for gas fees and stream payments.");
        return;
    }

    // 3. Target the provider's premium API
    const TARGET_URL = 'http://localhost:3005/api/premium';

    console.log(`\n--- [Step 1] Making Request to ${TARGET_URL} ---`);
    console.log("This will trigger the x402 payment flow if the provider requires payment.\n");

    try {
        // This handles the full x402 flow:
        // 1. Initial request → 402 Payment Required
        // 2. SDK reads payment requirements from headers
        // 3. AI brain decides: stream vs direct payment
        // 4. SDK creates payment stream with native TCRO
        // 5. SDK retries request with stream ID
        // 6. Provider validates stream and returns content
        const response = await sdk.makeRequest(TARGET_URL);
        console.log("✅ REQUEST SUCCESS!");
        console.log("📦 Response:", JSON.stringify(response.data, null, 2));
    } catch (e: any) {
        if (e.message.includes('ECONNREFUSED')) {
            console.error("❌ Connection refused. Make sure the provider is running:");
            console.error("   npx ts-node demo/provider.ts");
        } else {
            console.error("❌ Request Failed:", e.message);
        }
        return;
    }

    // 4. Demonstrate stream reuse (efficiency)
    console.log(`\n--- [Step 2] Subsequent Requests (Stream Reuse) ---`);
    console.log("Sending 3 rapid requests to demonstrate stream reuse...\n");

    for (let i = 1; i <= 3; i++) {
        try {
            const response = await sdk.makeRequest(TARGET_URL);
            console.log(`✅ Request ${i}: Success (Stream reused - no new transaction!)`);
        } catch (e: any) {
            console.error(`❌ Request ${i} failed:`, e.message);
        }
    }

    // 5. Report metrics
    const metrics = sdk.getMetrics();
    console.log(`\n📊 Efficiency Report:`);
    console.log(`   Total Requests Made: ${metrics.requestsSent}`);
    console.log(`   Blockchain Transactions: ${metrics.signersTriggered}`);
    console.log(`   ⚡ Transactions Saved: ${metrics.requestsSent - metrics.signersTriggered}`);

    // 6. Final balance check
    const finalBalance = await provider.getBalance(wallet.address);
    console.log(`\n💰 Final TCRO Balance: ${ethers.formatEther(finalBalance)} TCRO`);
    console.log(`   Spent: ${ethers.formatEther(balance - finalBalance)} TCRO`);

    console.log("\n🎉 Demo Complete!");
}

// Run the demo
if (require.main === module) {
    runDemo().catch(console.error);
}

export default runDemo;
