// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract FlowOrigin {
    event LargeTransfer(address indexed from, address indexed to, uint256 amount);
    event PriceUpdate(address indexed token, uint256 price);
    event CustomAction(address indexed actor, bytes32 indexed actionType, bytes data);

    function simulateTransfer(address to, uint256 amount) external {
        emit LargeTransfer(msg.sender, to, amount);
    }

    function simulatePriceUpdate(address token, uint256 price) external {
        emit PriceUpdate(token, price);
    }

    function simulateCustomAction(bytes32 actionType, bytes calldata data) external {
        emit CustomAction(msg.sender, actionType, data);
    }
}
