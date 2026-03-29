// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '../lib/reactive-lib/src/abstract-base/AbstractCallback.sol';

contract FlowDestination is AbstractCallback {
    event AlertReceived(
        address indexed rvmId,
        uint256 indexed topic1,
        uint256 indexed topic2,
        bytes data,
        uint256 timestamp
    );
    event GenericCallbackExecuted(
        address indexed rvmId,
        bool success
    );

    struct AlertRecord {
        address rvmId;
        uint256 topic1;
        uint256 topic2;
        bytes data;
        uint256 timestamp;
    }

    AlertRecord[] public alerts;
    uint256 public alertCount;

    constructor(address _callbackSender) AbstractCallback(_callbackSender) payable {
        // Allow callbacks from any RVM (shared destination for multiple flows)
        rvm_id = address(0);
    }

    function alertCallback(
        address _rvmId,
        uint256 _topic1,
        uint256 _topic2,
        bytes calldata _data
    ) external authorizedSenderOnly rvmIdOnly(_rvmId) {
        alerts.push(AlertRecord({
            rvmId: _rvmId,
            topic1: _topic1,
            topic2: _topic2,
            data: _data,
            timestamp: block.timestamp
        }));
        alertCount++;
        emit AlertReceived(_rvmId, _topic1, _topic2, _data, block.timestamp);
    }

    function genericCallback(
        address _rvmId,
        uint256 _topic1,
        uint256 _topic2,
        bytes calldata _data
    ) external authorizedSenderOnly rvmIdOnly(_rvmId) {
        emit GenericCallbackExecuted(_rvmId, true);
    }

    // Simple callback (matches Basic Demo pattern for maximum compatibility)
    function callback(address _rvmId) external authorizedSenderOnly rvmIdOnly(_rvmId) {
        alertCount++;
        emit AlertReceived(_rvmId, 0, 0, "", block.timestamp);
    }

    function getAlertCount() external view returns (uint256) {
        return alertCount;
    }

    function getAlert(uint256 index) external view returns (AlertRecord memory) {
        require(index < alertCount, "Index out of bounds");
        return alerts[index];
    }

    function getRecentAlerts(uint256 count) external view returns (AlertRecord[] memory) {
        uint256 start = alertCount > count ? alertCount - count : 0;
        uint256 len = alertCount - start;
        AlertRecord[] memory result = new AlertRecord[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = alerts[start + i];
        }
        return result;
    }
}
