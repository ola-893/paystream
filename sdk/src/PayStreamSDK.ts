import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import { GeminiPaymentBrain } from './GeminiPaymentBrain';
import { SpendingMonitor, SpendingLimits } from './SpendingMonitor';

export interface PayStreamConfig {
    privateKey: string;
    rpcUrl: string;
    apiKey?: string;

    spendingLimits?: SpendingLimits;
    agentId?: string;
}

export interface StreamMetadata {
    streamId: string;
    startTime: number;
    rate: bigint;
    amount: bigint;
}

export class PayStreamSDK {
    private wallet: Wallet;
    private provider: JsonRpcProvider;
    private apiKey?: string;
    private agentId?: string;

    private activeStreams: Map<string, StreamMetadata> = new Map();
    public brain: GeminiPaymentBrain;
    public monitor: SpendingMonitor;
    private isPaused: boolean = false;

    // Updated ABI for native TCRO contract (no token address getter)
    private MIN_ABI = [
        "function createStream(address recipient, uint256 duration, string metadata) external payable",
        "function isStreamActive(uint256 streamId) external view returns (bool)",
        "event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 totalAmount, uint256 startTime, uint256 stopTime, string metadata)"
    ];

    constructor(config: PayStreamConfig) {
        this.provider = new JsonRpcProvider(config.rpcUrl);
        this.wallet = new Wallet(config.privateKey, this.provider);
        this.apiKey = config.apiKey;
        this.brain = new GeminiPaymentBrain(process.env.GEMINI_API_KEY);
        this.agentId = config.agentId;

        // Default Limits: 100 TCRO daily, 1000 Total
        this.monitor = new SpendingMonitor(config.spendingLimits || {
            dailyLimit: ethers.parseEther("100"),
            totalLimit: ethers.parseEther("1000")
        });
    }

    // Metric counters
    private metrics = {
        requestsSent: 0,
        signersTriggered: 0
    };

    /**
     * Get efficiency metrics
     */
    public getMetrics() {
        return this.metrics;
    }

    public emergencyStop() {
        this.isPaused = true;
        console.warn("[PayStreamSDK] 🚨 EMERGENCY STOP ACTIVATED. All payments paused.");
    }

    public resume() {
        this.isPaused = false;
        console.log("[PayStreamSDK] ✅ System Resumed.");
    }

    /**
     * Get TCRO balance of the wallet
     */
    public async getTcroBalance(address?: string): Promise<string> {
        const targetAddress = address || this.wallet.address;
        const balance = await this.provider.getBalance(targetAddress);
        return ethers.formatEther(balance);
    }

    /**
     * AI/Hybrid Payment Brain
     * Decides whether to use 'direct' (per-request) or 'stream' (streaming) mode
     * based on estimated request volume and gas costs.
     */
    public async selectPaymentMode(estimatedRequests: number): Promise<'direct' | 'stream'> {
        const decision = await this.brain.shouldStream(estimatedRequests);
        console.log(`[PayStreamSDK] 🤖 Gemini Analysis: ${decision.reasoning}`);
        return decision.mode;
    }

    public async askAgent(query: string): Promise<string> {
        return this.brain.ask(query, {
            activeStreams: this.activeStreams.size,
            metrics: this.metrics
        });
    }

    /**
     * Makes an HTTP request with automatic x402 handling
     */
    public async makeRequest(url: string, options: AxiosRequestConfig = {}): Promise<AxiosResponse> {
        if (this.isPaused) {
            throw new Error("PayStreamSDK is paused due to Emergency Stop.");
        }
        this.metrics.requestsSent++;

        // Host extraction for simple caching key
        const host = new URL(url).host;
        const cachedStream = this.activeStreams.get(host);

        try {
            // Inject API Key if present
            const headers = { ...options.headers };
            if (this.apiKey) {
                (headers as any)['x-api-key'] = this.apiKey;
            }

            // Inject Cached Stream ID if available and valid
            if (cachedStream) {
                // Check remaining balance
                const remaining = this.calculateRemaining(cachedStream);
                if (remaining <= 0n) {
                    console.log("[PayStreamSDK] Cached stream depleted. Clearing cache...");
                    this.activeStreams.delete(host);
                } else {
                    // AUTO-RENEWAL CHECK - 10% threshold
                    const threshold = cachedStream.amount * 10n / 100n;
                    if (remaining < threshold) {
                        console.log("[PayStreamSDK] Stream balance low (<10%). Triggering renewal...");
                        this.activeStreams.delete(host);
                    } else {
                        (headers as any)['X-PayStream-Stream-ID'] = cachedStream.streamId;
                    }
                }
            }

            const enhancedOptions = { ...options, headers };
            return await axios(url, enhancedOptions);
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response && error.response.status === 402) {
                // If we used a cached stream ID and got 402, it means it expired or ran out.
                if (cachedStream) {
                    console.log("[PayStreamSDK] Cached stream failed. Clearing cache and renegotiating...");
                    this.activeStreams.delete(host);
                }

                console.log("[PayStreamSDK] 402 Payment Required intercepted. Negotiating...");
                return this.handlePaymentRequired(url, options, error.response);
            }
            throw error;
        }
    }

    private async handlePaymentRequired(url: string, options: AxiosRequestConfig, response: AxiosResponse): Promise<AxiosResponse> {
        this.metrics.signersTriggered++;

        const headers = response.headers;
        const mode = headers['x-paystream-mode'];
        const rate = headers['x-paystream-rate'];
        const contractAddress = headers['x-paystream-contract'];
        const recipientAddress = headers['x-paystream-recipient'];

        if (!contractAddress) {
            throw new Error("Missing X-PayStream-Contract header in 402 response");
        }

        // AI Decision Point
        const simN = (options.headers as any)?.['x-simulation-n'] ? parseInt((options.headers as any)['x-simulation-n'] as string) : 10;
        const selectedMode = await this.selectPaymentMode(simN);

        if (selectedMode === 'direct') {
            const price = ethers.parseEther(rate || "0.0001");
            return this.performDirectPayment(url, options, recipientAddress || contractAddress, price);
        }

        // Stream mode
        if (mode !== 'streaming' && mode !== 'hybrid') {
            throw new Error(`PayStreamSDK currently only supports 'streaming' or 'hybrid' mode. Got: ${mode}`);
        }

        // Create a Stream with native TCRO
        const duration = 3600; // 1 hour
        const rateBn = ethers.parseEther(rate || "0.0001");
        const totalAmount = rateBn * BigInt(duration);

        // SAFETY CHECKS
        try {
            this.monitor.checkAndRecordSpend(totalAmount);
        } catch (e: any) {
            console.error(`[PayStreamSDK] Spend Declined: ${e.message}`);
            throw e;
        }

        // Suspicious Activity Check
        if (this.monitor.checkSuspiciousActivity()) {
            this.emergencyStop();
            throw new Error("Suspicious renewal activity detected. System Emergency Paused.");
        }

        console.log(`[PayStreamSDK] Initiating Stream: ${ethers.formatEther(totalAmount)} TCRO for ${duration}s`);

        const recipient = recipientAddress || contractAddress;
        const streamData = await this.createStream(contractAddress, recipient, totalAmount, duration, {
            type: "SDK_AUTO",
            target: url
        });

        // Cache the new stream for this host
        const host = new URL(url).host;
        this.activeStreams.set(host, {
            streamId: streamData.streamId,
            startTime: Number(streamData.startTime),
            rate: rateBn,
            amount: totalAmount
        });

        console.log(`[PayStreamSDK] Stream #${streamData.streamId} created. Retrying request...`);

        const retryOptions = {
            ...options,
            headers: {
                ...options.headers,
                'X-PayStream-Stream-ID': streamData.streamId
            }
        };

        if (this.apiKey) {
            (retryOptions.headers as any)['x-api-key'] = this.apiKey;
        }

        return await axios(url, retryOptions);
    }

    /**
     * Creates a stream by sending native TCRO to the contract
     */
    public async createStream(
        contractAddress: string,
        recipient: string,
        amount: bigint,
        duration: number,
        metadata: any = {}
    ): Promise<{ streamId: string, startTime: bigint }> {
        const payStream = new Contract(contractAddress, this.MIN_ABI, this.wallet);

        // Metadata Construction
        const enrichedMetadata = {
            ...metadata,
            agentId: this.agentId || "anonymous",
            timestamp: Date.now(),
            client: "PayStreamSDK/2.0-TCRO"
        };
        const metadataString = JSON.stringify(enrichedMetadata);

        console.log(`[PayStreamSDK] Creating stream to ${recipient} with ${ethers.formatEther(amount)} TCRO...`);

        // Send native TCRO with the transaction (no token approval needed!)
        const tx = await payStream.createStream(recipient, duration, metadataString, { value: amount });
        const receipt = await tx.wait();

        // Parse event to get ID
        const log = receipt.logs.find((l: any) => {
            try {
                return payStream.interface.parseLog(l)?.name === 'StreamCreated';
            } catch { return false; }
        });

        if (!log) throw new Error("StreamCreated event not found");

        const parsed = payStream.interface.parseLog(log);
        const streamId = parsed?.args[0].toString();
        const startTime = parsed?.args[4];

        return { streamId, startTime };
    }

    public calculateClaimable(stream: StreamMetadata): bigint {
        const now = BigInt(Math.floor(Date.now() / 1000));
        const start = BigInt(stream.startTime);
        if (now <= start) return 0n;

        const elapsed = now - start;
        return elapsed * stream.rate;
    }

    public calculateRemaining(stream: StreamMetadata): bigint {
        const claimable = this.calculateClaimable(stream);
        const remaining = stream.amount - claimable;
        return remaining > 0n ? remaining : 0n;
    }

    /**
     * Perform a direct TCRO payment (sending native currency)
     */
    private async performDirectPayment(url: string, options: AxiosRequestConfig, recipient: string, amount: bigint): Promise<AxiosResponse> {
        if (this.isPaused) throw new Error("PayStreamSDK is paused.");

        // SAFETY CHECK
        this.monitor.checkAndRecordSpend(amount);

        console.log(`[PayStreamSDK] Executing Direct Payment of ${ethers.formatEther(amount)} TCRO to ${recipient}`);

        // Send native TCRO directly
        const tx = await this.wallet.sendTransaction({
            to: recipient,
            value: amount
        });
        await tx.wait();

        console.log(`[PayStreamSDK] Direct Payment Sent: ${tx.hash}`);

        const retryOptions = {
            ...options,
            headers: {
                ...options.headers,
                'X-PayStream-Tx-Hash': tx.hash
            }
        };

        if (this.apiKey) {
            (retryOptions.headers as any)['x-api-key'] = this.apiKey;
        }

        return await axios(url, retryOptions);
    }

    public getStreamDetails(streamId: string): any {
        return {
            streamId,
            agentId: this.agentId || "unknown",
            client: "PayStreamSDK/2.0-TCRO"
        };
    }
}
