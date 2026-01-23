const { ethers } = require('ethers');

/**
 * PayStream x402 Express Middleware (TCRO Native Version)
 * @param {Object} config Middleware configuration
 * @param {Object} config.routes Map of routes to pricing config
 * @param {string} config.payStreamContractAddress PayStreamStream Contract Address
 * @param {string} config.rpcUrl RPC URL for blockchain connection
 * @param {string} config.recipientAddress Payment recipient address
 * @param {string} config.apiKey Optional API Key for authentication
 */
const payStreamMiddleware = (config) => {
    // Initialize provider and contract OR use mock
    let payStreamContract;

    if (config.mockContract) {
        payStreamContract = config.mockContract;
    } else {
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        payStreamContract = new ethers.Contract(
            config.payStreamContractAddress,
            [
                "function isStreamActive(uint256 streamId) external view returns (bool)",
                "function getClaimableBalance(uint256 streamId) external view returns (uint256)",
                "function streams(uint256 streamId) external view returns (address sender, address recipient, uint256 totalAmount, uint256 flowRate, uint256 startTime, uint256 stopTime, uint256 amountWithdrawn, bool isActive, string metadata)"
            ],
            provider
        );
    }

    return async (req, res, next) => {
        const path = req.path;

        // Find matching route config
        let routeConfig = config.routes[path];
        if (!routeConfig) {
            // Try finding a matching prefix if exact match fails
            const matchingKey = Object.keys(config.routes).find(key => path.startsWith(key));
            if (matchingKey) {
                routeConfig = config.routes[matchingKey];
            }
        }

        // If route is not configured for payment, proceed freely
        if (!routeConfig) {
            return next();
        }

        // 0. API Key Authentication
        if (config.apiKey) {
            const clientKey = req.headers['x-api-key'];
            if (!clientKey || clientKey !== config.apiKey) {
                return res.status(401).json({ error: "Unauthorized: Invalid or missing API Key" });
            }
        }

        const streamIdHeader = req.headers['x-paystream-stream-id'];
        const txHashHeader = req.headers['x-paystream-tx-hash'];

        // 1. Check for Direct Payment (Native TCRO Tx Hash)
        if (txHashHeader) {
            try {
                let isValidPayment = false;
                if (config.mockContract) {
                    // Mock validation
                    isValidPayment = true;
                    console.log(`[PayStream] Validated Direct TCRO Payment Tx: ${txHashHeader}`);
                } else {
                    // Real provider validation - check tx hash format
                    if (txHashHeader.startsWith('0x') && txHashHeader.length === 66) {
                        isValidPayment = true;
                    }
                }

                if (isValidPayment) {
                    console.log(`[PayStream] Request accepted for ${path} using Direct TCRO Payment Tx: ${txHashHeader}`);
                    req.payStream = { txHash: txHashHeader, mode: 'direct' };
                    return next();
                }
            } catch (e) {
                console.error("Direct payment verification failed:", e);
            }
        }

        // Calculate required amount from route config
        const requiredAmount = ethers.parseEther(routeConfig.price || '0');

        // 2. Check for Stream ID Header
        if (!streamIdHeader) {
            return send402Response(res, routeConfig, config, requiredAmount);
        }

        try {
            // 2. Verify Stream ID
            const streamId = BigInt(streamIdHeader);

            console.log(`[PayStream] Verifying stream #${streamId} for ${path}...`);

            const isActive = await payStreamContract.isStreamActive(streamId);

            if (!isActive) {
                console.log(`[PayStream] Stream #${streamId} verification result: INACTIVE`);
                return res.status(402).json({
                    error: "Stream is inactive",
                    detail: "The provided stream ID is not active. Please open a new stream."
                });
            }

            console.log(`[PayStream] Stream #${streamId} verification result: ACTIVE`);
            console.log(`[PayStream] Request accepted for ${path} using Stream #${streamId}`);

            // Attach stream info to request for downstream use
            req.payStream = {
                streamId: streamId.toString()
            };

            next();
        } catch (error) {
            console.error("[PayStream] Stream verification failed:", error);
            console.log(`[PayStream] Stream #${streamIdHeader} verification result: ERROR - ${error.message}`);
            const requiredAmountFallback = ethers.parseEther(routeConfig.price || '0');
            return send402Response(res, routeConfig, config, requiredAmountFallback);
        }
    };
};

function send402Response(res, routeConfig, config, requiredAmount) {
    // Set all required x402 headers for native TCRO
    res.set('X-Payment-Required', 'true');
    res.set('X-PayStream-Mode', routeConfig.mode || 'streaming');
    res.set('X-PayStream-Rate', ethers.formatEther(requiredAmount));
    res.set('X-PayStream-Recipient', config.recipientAddress || '');
    res.set('X-PayStream-Contract', config.payStreamContractAddress || '');
    res.set('X-PayStream-Currency', 'TCRO');
    res.set('X-PayStream-MinDeposit', routeConfig.minDeposit || '0.001');

    // Standard 402 body
    res.status(402).json({
        message: "Payment Required",
        requirements: {
            mode: routeConfig.mode || 'streaming',
            price: ethers.formatEther(requiredAmount),
            currency: "TCRO",
            contract: config.payStreamContractAddress,
            recipient: config.recipientAddress,
            minDeposit: routeConfig.minDeposit || '0.001'
        }
    });
}

module.exports = payStreamMiddleware;
