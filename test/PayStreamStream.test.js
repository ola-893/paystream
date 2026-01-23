const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PayStreamStream", function () {
    let PayStreamStream;
    let payStreamStream;
    let owner;
    let recipient;
    let otherAccount;

    beforeEach(async function () {
        [owner, recipient, otherAccount] = await ethers.getSigners();

        // Deploy PayStreamStream (no constructor args - uses native TCRO)
        PayStreamStream = await ethers.getContractFactory("PayStreamStream");
        payStreamStream = await PayStreamStream.deploy();
        await payStreamStream.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await payStreamStream.getAddress()).to.be.properAddress;
        });
    });

    describe("Stream Creation", function () {
        it("Should create a stream successfully with native TCRO", async function () {
            const amount = ethers.parseEther("1"); // 1 TCRO
            const duration = 100; // 100 seconds

            const tx = await payStreamStream.createStream(
                recipient.address,
                duration,
                "metadata",
                { value: amount }
            );
            const receipt = await tx.wait();

            // Check event
            const event = receipt.logs.find(log => {
                try {
                    return payStreamStream.interface.parseLog(log).name === 'StreamCreated';
                } catch (e) {
                    return false;
                }
            });
            expect(event).to.not.be.undefined;

            const args = payStreamStream.interface.parseLog(event).args;
            expect(args.recipient).to.equal(recipient.address);
            expect(args.totalAmount).to.equal(amount);
            expect(args.metadata).to.equal("metadata");
        });

        it("Should fail if no TCRO is sent", async function () {
            const duration = 100;

            await expect(
                payStreamStream.createStream(recipient.address, duration, "metadata", { value: 0 })
            ).to.be.revertedWith("PayStreamStream: Must send TCRO to create stream.");
        });

        it("Should fail if recipient is zero address", async function () {
            const amount = ethers.parseEther("1");
            const duration = 100;

            await expect(
                payStreamStream.createStream(ethers.ZeroAddress, duration, "metadata", { value: amount })
            ).to.be.revertedWith("PayStreamStream: Recipient cannot be the zero address.");
        });
    });

    describe("Withdrawal", function () {
        it("Should allow withdrawal of accrued TCRO", async function () {
            const amount = ethers.parseEther("1");
            const duration = 100;

            await payStreamStream.createStream(recipient.address, duration, "metadata", { value: amount });

            // Increase time by 50 seconds
            await ethers.provider.send("evm_increaseTime", [50]);
            await ethers.provider.send("evm_mine");

            const streamId = 1;
            const claimable = await payStreamStream.getClaimableBalance(streamId);

            // Approx 0.5 TCRO
            expect(claimable).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));

            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            const tx = await payStreamStream.connect(recipient).withdrawFromStream(streamId);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);

            // Balance should increase by claimable minus gas
            expect(recipientBalanceAfter - recipientBalanceBefore + gasUsed).to.be.closeTo(claimable, ethers.parseEther("0.02"));
        });
    });

    describe("Cancellation", function () {
        it("Should allow sender to cancel and refund remaining TCRO", async function () {
            const amount = ethers.parseEther("1");
            const duration = 100;

            await payStreamStream.createStream(recipient.address, duration, "metadata", { value: amount });

            // Increase time by 50 seconds
            await ethers.provider.send("evm_increaseTime", [50]);
            await ethers.provider.send("evm_mine");

            const streamId = 1;

            const senderBalanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await payStreamStream.cancelStream(streamId);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const senderBalanceAfter = await ethers.provider.getBalance(owner.address);

            // Should get back approx 0.5 TCRO minus gas
            expect(senderBalanceAfter - senderBalanceBefore + gasUsed).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));

            expect(await payStreamStream.isStreamActive(streamId)).to.be.false;
        });
    });

    describe("Active Check", function () {
        it("Should return true for active stream", async function () {
            const amount = ethers.parseEther("1");
            const duration = 100;
            await payStreamStream.createStream(recipient.address, duration, "metadata", { value: amount });
            expect(await payStreamStream.isStreamActive(1)).to.be.true;
        });
    });
});
