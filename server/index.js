const express = require('express');
const cors = require('cors');
const flowPayMiddleware = require('./middleware/flowPayMiddleware');
require('dotenv').config({ path: '../.env' }); // Load from root .env if available

// Mock Config if env vars missing
const PORT = process.env.PORT || 3001;
const MNEE_ADDRESS = process.env.VITE_MNEE_TOKEN_ADDRESS || process.env.MNEE_TOKEN || "0x96B1FE54Ee89811f46ecE4a347950E0D682D3896";
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || process.env.FLOWPAY_CONTRACT || "0x155A00fBE3D290a8935ca4Bf5244283685Bb0035";
const RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
// Recipient address for payments - use a dedicated server wallet or fallback to a test address
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS || "0x1f973bc13Fe975570949b09C022dCCB46944F5ED";

const app = express();
app.use(cors());
app.use(express.json());

// FlowPay Configuration
const defaultConfig = {
    rpcUrl: RPC_URL,
    flowPayContractAddress: CONTRACT_ADDRESS,
    mneeAddress: MNEE_ADDRESS,
    recipientAddress: RECIPIENT_ADDRESS,
    routes: {
        '/api/weather': {
            price: '0.0001', // MNEE per second (streaming mode)
            mode: 'streaming',
            description: 'Real-time weather data',
            minDeposit: '0.36' // 1 hour of streaming at 0.0001/sec
        },
        '/api/premium': {
            price: '0.01', // MNEE per request
            mode: 'per-request',
            description: 'Premium content'
        },
        '/api/expensive': {
            price: '1000', // Very expensive - for budget exceeded testing
            mode: 'per-request',
            description: 'Expensive API for budget testing'
        }
    }
};

const createApp = (config = defaultConfig) => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Apply Middleware for x402 handling
    app.use(flowPayMiddleware(config));

    // Protected Route (Streaming)
    app.get('/api/weather', (req, res) => {
        res.json({
            temperature: 22,
            city: 'London',
            condition: 'Cloudy',
            paidWithStream: req.flowPay.streamId
        });
    });

    // Protected Route (Example for different pricing)
    app.get('/api/premium', (req, res) => {
        res.json({
            content: "This is premium content.",
            paidWithStream: req.flowPay.streamId
        });
    });

    // Protected Route (Expensive - for budget exceeded testing)
    app.get('/api/expensive', (req, res) => {
        res.json({
            content: "This is very expensive premium content.",
            paidWithStream: req.flowPay.streamId
        });
    });

    // Public Route
    app.get('/api/free', (req, res) => {
        res.json({
            message: "This is free content."
        });
    });

    return app;
};

// Start server if run directly
if (require.main === module) {
    const app = createApp();
    app.listen(PORT, () => {
        console.log(`FlowPay Test Server running on port ${PORT}`);
        console.log(`MNEE Address: ${MNEE_ADDRESS}`);
        console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
    });
}

module.exports = createApp; // Export factory for testing
