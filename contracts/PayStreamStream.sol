// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
* @title PayStreamStream
* @dev A protocol for creating real-time, per-second money streams on Cronos using native TCRO.
*/
contract PayStreamStream {
    // Structure to hold all data for a single stream
    struct Stream {
        address sender;
        address recipient;
        uint256 totalAmount;        // The total amount to be streamed (in wei).
        uint256 flowRate;           // Amount per second (in wei).
        uint256 startTime;          // Timestamp when the stream begins.
        uint256 stopTime;           // Timestamp when the stream ends.
        uint256 amountWithdrawn;    // Total amount withdrawn by the recipient.
        bool isActive;              // Status of the stream.
        string metadata;            // JSON metadata for agent identification
    }

    // Mapping from a unique streamId to the Stream struct
    mapping(uint256 => Stream) public streams;
    uint256 private nextStreamId = 1;

    // Events
    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 totalAmount, uint256 startTime, uint256 stopTime, string metadata);
    event Withdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event StreamCancelled(uint256 indexed streamId, address sender, address recipient, uint256 senderBalance, uint256 recipientBalance);

    constructor() {}

    /**
    * @dev Calculates the amount accrued to the recipient for a given stream at the current time.
    * @param streamId The ID of the stream.
    * @return The amount the recipient is eligible to withdraw.
    */
    function getClaimableBalance(uint256 streamId) public view returns (uint256) {
        Stream storage stream = streams[streamId];
        require(stream.isActive, "PayStreamStream: Stream is not active.");

        // If the current time is before the start time, nothing has been streamed.
        if (block.timestamp < stream.startTime) {
            return 0;
        }

        // If the current time is after the stop time, the full remaining amount is claimable.
        if (block.timestamp >= stream.stopTime) {
            return stream.totalAmount - stream.amountWithdrawn;
        }

        // Otherwise, calculate the streamed amount based on time elapsed.
        uint256 streamedAmount = (block.timestamp - stream.startTime) * stream.flowRate;
        return streamedAmount - stream.amountWithdrawn;
    }

    /**
    * @dev Creates a new money stream using native TCRO.
    * @param recipient The address that will receive the funds.
    * @param duration The duration of the stream in seconds.
    * @param metadata JSON string containing agent identification and other info.
    * @notice Send TCRO with this transaction. The msg.value becomes the stream amount.
    */
    function createStream(address recipient, uint256 duration, string calldata metadata) external payable {
        require(msg.value > 0, "PayStreamStream: Must send TCRO to create stream.");
        require(recipient != address(0), "PayStreamStream: Recipient cannot be the zero address.");
        require(duration > 0, "PayStreamStream: Duration must be greater than 0.");

        uint256 amount = msg.value;
        uint256 streamId = nextStreamId++;
        uint256 startTime = block.timestamp;
        uint256 stopTime = startTime + duration;
        // Floor division to avoid rounding up. Require non-zero rate to prevent zero-per-second streams.
        uint256 flowRate = amount / duration;
        require(flowRate > 0, "PayStreamStream: flowRate would be zero. Increase amount or duration.");

        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            totalAmount: amount,
            flowRate: flowRate,
            startTime: startTime,
            stopTime: stopTime,
            amountWithdrawn: 0,
            isActive: true,
            metadata: metadata
        });

        emit StreamCreated(streamId, msg.sender, recipient, amount, startTime, stopTime, metadata);
    }

    /**
    * @dev Allows the recipient to withdraw their accrued funds.
    * @param streamId The ID of the stream to withdraw from.
    */
    function withdrawFromStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        require(stream.isActive, "PayStreamStream: Stream is not active.");
        require(msg.sender == stream.recipient, "PayStreamStream: Caller is not the recipient.");

        uint256 claimableAmount = getClaimableBalance(streamId);
        require(claimableAmount > 0, "PayStreamStream: No funds to withdraw.");

        stream.amountWithdrawn += claimableAmount;
        
        // Transfer native TCRO to recipient
        (bool success, ) = stream.recipient.call{value: claimableAmount}("");
        require(success, "PayStreamStream: TCRO transfer failed.");

        emit Withdrawn(streamId, stream.recipient, claimableAmount);
    }

    /**
    * @dev Cancels a stream and refunds both parties.
    * @param streamId The ID of the stream to cancel.
    */
    function cancelStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        require(stream.isActive, "PayStreamStream: Stream already cancelled.");
        require(msg.sender == stream.sender || msg.sender == stream.recipient, "PayStreamStream: Caller cannot cancel this stream.");

        uint256 recipientBalance = getClaimableBalance(streamId);
        uint256 senderBalance = (stream.totalAmount - stream.amountWithdrawn) - recipientBalance;
        
        stream.isActive = false;

        // Transfer to recipient
        if (recipientBalance > 0) {
            (bool success, ) = stream.recipient.call{value: recipientBalance}("");
            require(success, "PayStreamStream: Recipient transfer failed on cancel.");
        }

        // Refund to sender
        if (senderBalance > 0) {
            (bool success, ) = stream.sender.call{value: senderBalance}("");
            require(success, "PayStreamStream: Sender refund failed on cancel.");
        }

        emit StreamCancelled(streamId, stream.sender, stream.recipient, senderBalance, recipientBalance);
    }

    /**
     * @dev Checks if a stream is active and valid.
     * @param streamId The ID of the stream to check.
     * @return True if the stream is active, false otherwise.
     */
    function isStreamActive(uint256 streamId) external view returns (bool) {
        return streams[streamId].isActive;
    }

    /**
     * @dev Allows the contract to receive TCRO directly (for potential future features).
     */
    receive() external payable {}
}
