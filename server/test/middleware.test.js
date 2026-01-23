const request = require('supertest');
const { expect } = require('chai');
const createApp = require('../index');

describe('x402 Middleware Integration', function () {
    let app;
    let mockContract;

    beforeEach(() => {
        mockContract = {
            isStreamActive: async (id) => {
                if (id === 100n) return true; // Valid stream
                if (id === 99n) return false; // Inactive stream
                throw new Error("RPC Error"); // Simulate network error
            }
        };

        const testConfig = {
            rpcUrl: "http://localhost:8545", // Dummy
            flowPayContractAddress: "0xMock",
            mockContract: mockContract, // Inject mock
            routes: {
                '/api/weather': {
                    price: '0.0001',
                    mode: 'streaming'
                },
                '/api/premium': {
                    price: '1.0',
                    mode: 'per-request'
                }
            }
        };

        app = createApp(testConfig);
    });

    describe('Public Routes', function () {
        it('should allow access to public routes without payment', async function () {
            const res = await request(app).get('/api/free');
            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal("This is free content.");
        });
    });

    describe('Protected Routes (No Payment)', function () {
        it('should return 402 for protected route without headers', async function () {
            const res = await request(app).get('/api/weather');
            expect(res.status).to.equal(402);
            expect(res.header['x-payment-required']).to.equal('true');
            expect(res.header['x-flowpay-mode']).to.equal('streaming');
            expect(res.header['x-flowpay-rate']).to.equal('0.0001');
            expect(res.body.requirements).to.exist;
        });

        it('should return 402 for premium route with correct pricing', async function () {
            const res = await request(app).get('/api/premium');
            expect(res.status).to.equal(402);
            expect(res.header['x-flowpay-mode']).to.equal('per-request');
            expect(res.header['x-flowpay-rate']).to.equal('1.0');
        });

        it('should include all required x402 headers in 402 response', async function () {
            const res = await request(app).get('/api/weather');
            expect(res.status).to.equal(402);
            // Verify all required headers per Requirements 2.2
            expect(res.header['x-payment-required']).to.equal('true');
            expect(res.header['x-flowpay-mode']).to.exist;
            expect(res.header['x-flowpay-rate']).to.exist;
            expect(res.header['x-flowpay-recipient']).to.exist;
            expect(res.header['x-flowpay-contract']).to.exist;
            expect(res.header['x-flowpay-mindeposit']).to.exist;
        });

        it('should specify TCRO currency in x402 headers and response body', async function () {
            const res = await request(app).get('/api/weather');
            expect(res.status).to.equal(402);
            // Verify TCRO currency header per Requirements 4.1
            expect(res.header['x-flowpay-currency']).to.equal('TCRO');
            // Verify TCRO currency in response body per Requirements 4.1
            expect(res.body.requirements.currency).to.equal('TCRO');
        });
    });

    describe('Protected Routes (With Payment)', function () {
        it('should return 200 for valid active stream', async function () {
            const res = await request(app)
                .get('/api/weather')
                .set('X-FlowPay-Stream-ID', '100');

            expect(res.status).to.equal(200);
            expect(res.body.paidWithStream).to.equal('100');
        });

        it('should return 402 for inactive stream', async function () {
            const res = await request(app)
                .get('/api/weather')
                .set('X-FlowPay-Stream-ID', '99');

            // Middleware checks stream, sees false, returns 402 error json
            expect(res.status).to.equal(402);
            expect(res.body.error).to.equal("Stream is inactive");
        });

        it('should fallback to 402/Requirements on system error', async function () {
            const res = await request(app)
                .get('/api/weather')
                .set('X-FlowPay-Stream-ID', '0'); // triggers throw in mock

            // When verification crashes, it should default to sending the payment requirements again
            expect(res.status).to.equal(402);
            expect(res.body.requirements).to.exist;
        });
    });

    describe('TCRO Configuration Tests', function () {
        it('should consistently use TCRO currency across all protected routes', async function () {
            const routes = ['/api/weather', '/api/premium'];
            
            for (const route of routes) {
                const res = await request(app).get(route);
                expect(res.status).to.equal(402);
                expect(res.header['x-flowpay-currency']).to.equal('TCRO');
                expect(res.body.requirements.currency).to.equal('TCRO');
            }
        });

        it('should use TCRO denominations in pricing configuration', async function () {
            const res = await request(app).get('/api/weather');
            expect(res.status).to.equal(402);
            
            // Verify pricing is in TCRO format (decimal string)
            const rate = res.header['x-flowpay-rate'];
            expect(rate).to.match(/^\d+(\.\d+)?$/); // Should be decimal format
            expect(parseFloat(rate)).to.be.greaterThan(0);
            
            // Verify response body pricing
            expect(res.body.requirements.price).to.match(/^\d+(\.\d+)?$/);
            expect(parseFloat(res.body.requirements.price)).to.be.greaterThan(0);
        });

        it('should not include token addresses in TCRO configuration', async function () {
            const res = await request(app).get('/api/weather');
            expect(res.status).to.equal(402);
            
            // Verify no token address headers
            expect(res.header['x-flowpay-token']).to.be.undefined;
            expect(res.header['x-tcro-address']).to.be.undefined;
            
            // Verify no token address in response body
            expect(res.body.requirements.token).to.be.undefined;
            expect(res.body.requirements.tokenAddress).to.be.undefined;
        });

        it('should validate TCRO stream transactions correctly', async function () {
            // Test with valid stream ID (should pass validation)
            const validRes = await request(app)
                .get('/api/weather')
                .set('X-FlowPay-Stream-ID', '100');
            
            expect(validRes.status).to.equal(200);
            expect(validRes.body.paidWithStream).to.equal('100');
            
            // Test with invalid stream ID (should fail validation)
            const invalidRes = await request(app)
                .get('/api/weather')
                .set('X-FlowPay-Stream-ID', '99');
            
            expect(invalidRes.status).to.equal(402);
            expect(invalidRes.body.error).to.equal("Stream is inactive");
        });

        it('should handle direct TCRO payment validation', async function () {
            const validTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';
            
            const res = await request(app)
                .get('/api/weather')
                .set('X-FlowPay-Tx-Hash', validTxHash);
            
            expect(res.status).to.equal(200);
            expect(res.body.paidWithStream).to.be.undefined; // Direct payment, not stream
        });
    });
});
