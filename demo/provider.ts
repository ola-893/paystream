import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middleware - using require for CommonJS module
// eslint-disable-next-line @typescript-eslint/no-var-requires
const payStreamMiddleware = require('../server/middleware/payStreamMiddleware');

// Contract addresses on Cronos Testnet
const PAYSTREAMSTREAM_ADDRESS = process.env.PAYSTREAM_CONTRACT || '0x62E0EC7483E779DA0fCa9B701872e4af8a0FEd87';
// Use Cronos Testnet RPC endpoint
const CRONOS_RPC_URL = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';

/**
 * Demo Provider: "The Gatekeeper"
 * 
 * This is a premium API service that:
 * 1. Requires TCRO payment streams for access
 * 2. Uses x402 protocol to negotiate payments
 * 3. Validates streams on-chain before serving content
 */
const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// Real blockchain configuration for Cronos Testnet
const config = {
    payStreamContractAddress: PAYSTREAMSTREAM_ADDRESS,
    rpcUrl: CRONOS_RPC_URL,
    routes: {
        '/api/premium': {
            mode: 'streaming',
            price: '0.0001' // 0.0001 TCRO per second
        },
        '/api/ai-insight': {
            mode: 'streaming',
            price: '0.001' // 0.001 TCRO per second (higher tier)
        }
    }
};

console.log("🔧 Provider Configuration:");
console.log(`   PayStreamStream Contract: ${PAYSTREAMSTREAM_ADDRESS}`);
console.log(`   RPC URL: ${CRONOS_RPC_URL}`);

// Apply PayStream Middleware (validates payment streams on-chain)
app.use(payStreamMiddleware(config));

// Health check endpoint (no payment required)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Protected Premium Content Route
app.get('/api/premium', (req: any, res) => {
    const streamId = req.payStream?.streamId || 'unknown';
    
    console.log(`📦 Serving premium content for Stream #${streamId}`);
    
    res.json({
        success: true,
        data: "🌟 This is PREMIUM content delivered via real TCRO payment streaming!",
        streamId: streamId,
        timestamp: Date.now(),
        message: "Your AI agent successfully negotiated payment and accessed this protected resource."
    });
});

// Protected AI Insight Route (higher tier)
app.get('/api/ai-insight', (req: any, res) => {
    const streamId = req.payStream?.streamId || 'unknown';
    const txHash = req.payStream?.txHash;
    
    console.log(`🧠 Serving AI insight for Stream #${streamId}`);
    
    res.json({
        success: true,
        insight: "Based on current market analysis: diversify your portfolio across multiple asset classes.",
        confidence: 0.87,
        streamId: streamId,
        paidWith: txHash || `stream:${streamId}`,
        timestamp: Date.now()
    });
});

// Info endpoint (no payment required)
app.get('/api/info', (req, res) => {
    res.json({
        name: "PayStream Demo Provider",
        version: "1.0.0",
        network: "Cronos Testnet",
        contracts: {
            payStreamStream: PAYSTREAMSTREAM_ADDRESS,
        },
        protectedRoutes: [
            { path: '/api/premium', price: '0.0001 TCRO/sec', mode: 'streaming' },
            { path: '/api/ai-insight', price: '0.001 TCRO/sec', mode: 'streaming' }
        ],
        documentation: "https://paystream.dev/docs"
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 PayStream Demo Provider running on http://localhost:${PORT}`);
        console.log(`\n📋 Available Endpoints:`);
        console.log(`   GET /health          - Health check (free)`);
        console.log(`   GET /api/info        - API info (free)`);
        console.log(`   GET /api/premium     - Premium content (0.0001 TCRO/sec)`);
        console.log(`   GET /api/ai-insight  - AI insights (0.001 TCRO/sec)`);
        console.log(`\n💡 To test, run the consumer in another terminal:`);
        console.log(`   npx ts-node demo/consumer.ts`);
    });
}

export default app;
