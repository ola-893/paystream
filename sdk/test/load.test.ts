import { expect } from 'chai';
import { PayStreamSDK } from '../src/PayStreamSDK';
import { Wallet, ethers } from 'ethers';
import express, { Express } from 'express';
import { Server } from 'http';

// Mock Server Setup
const app = express();
app.use(express.json());

// Mock 402 Route
app.get('/api/load', (req, res) => {
    const streamId = req.headers['x-paystream-stream-id'];
    if (streamId === 'STREAM_1') {
        res.json({ success: true });
    } else {
        res.status(402).set({
            'X-Payment-Required': 'true',
            'X-PayStream-Mode': 'streaming',
            'X-PayStream-Rate': '0.0001',
            'X-PayStream-Currency': 'TCRO',
            'X-PayStream-Contract': '0xContract'
        }).json({
            error: "Payment Required"
        });
    }
});

let server: Server;
const PORT = 3006;
const BASE_URL = `http://localhost:${PORT}`;

describe('PayStreamSDK Load & Efficiency Tests', () => {
    let sdk: PayStreamSDK;
    let createStreamCallCount = 0;

    before((done) => {
        server = app.listen(PORT, done);
    });

    after((done) => {
        server.close(done);
    });

    beforeEach(() => {
        createStreamCallCount = 0;

        sdk = new PayStreamSDK({
            privateKey: Wallet.createRandom().privateKey,
            rpcUrl: 'http://localhost:8545'
        });

        // Mock createStream
        sdk.createStream = async (contract: string, token: string, amount: bigint, duration: number) => {
            // console.log(`[Mock] createStream...`);
            createStreamCallCount++;
            return { streamId: 'STREAM_1', startTime: BigInt(Date.now()) };
        };
    });

    it('Efficiency: Should only create ONE TCRO stream for multiple sequential requests', async () => {
        const REQUEST_COUNT = 10;

        for (let i = 0; i < REQUEST_COUNT; i++) {
            const res = await sdk.makeRequest(`${BASE_URL}/api/load`);
            expect(res.status).to.equal(200);
        }

        // Verify metrics
        const metrics = sdk.getMetrics();
        expect(metrics.requestsSent).to.equal(REQUEST_COUNT); // SDK tracks attempts

        // Ideally signersTriggered should be 1
        expect(metrics.signersTriggered).to.equal(1);

        // Verify underlying mock call
        expect(createStreamCallCount).to.equal(1);
    });

    it('Efficiency: Should reuse TCRO stream for concurrent requests', async () => {
        // First establish cache
        await sdk.makeRequest(`${BASE_URL}/api/load`);
        expect(createStreamCallCount).to.equal(1);

        // Then fire 20 requests concurrently
        const promises = [];
        for (let i = 0; i < 20; i++) {
            promises.push(sdk.makeRequest(`${BASE_URL}/api/load`));
        }

        const results = await Promise.all(promises);
        results.forEach(res => expect(res.status).to.equal(200));

        // Should still only be 1 total stream creation
        expect(createStreamCallCount).to.equal(1);
    });
});
