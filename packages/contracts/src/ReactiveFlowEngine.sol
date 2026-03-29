// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '../lib/reactive-lib/src/interfaces/IReactive.sol';
import '../lib/reactive-lib/src/abstract-base/AbstractReactive.sol';

contract ReactiveFlowEngine is AbstractReactive {
    uint64 public constant CALLBACK_GAS_LIMIT = 1000000;

    // Flow config (set in constructor, immutable)
    uint256 public originChainId;
    uint256 public destinationChainId;
    address public destinationContract;

    // Condition config
    uint8 public conditionOp;      // 0=NONE,1=GT,2=LT,3=GTE,4=LTE,5=EQ,6=NEQ
    uint256 public threshold;
    uint8 public dataOffset;       // byte offset in event data

    // Action config
    uint8 public actionType;       // 0=ALERT, 1=GENERIC_CALLBACK
    bytes4 public callbackSelector;

    // Stats
    uint256 public executionCount;
    uint256 public maxExecutions;  // 0 = unlimited
    string public flowName;

    event FlowTriggered(uint256 indexed originChainId, uint256 indexed executionCount);

    constructor(
        string memory _name,
        uint256 _originChainId,
        address _originContract,
        uint256 _topic0,
        uint256 _destinationChainId,
        address _destinationContract,
        uint8 _conditionOp,
        uint256 _threshold,
        uint8 _dataOffset,
        uint8 _actionType,
        bytes4 _callbackSelector,
        uint256 _maxExecutions
    ) payable {
        flowName = _name;
        originChainId = _originChainId;
        destinationChainId = _destinationChainId;
        destinationContract = _destinationContract;
        conditionOp = _conditionOp;
        threshold = _threshold;
        dataOffset = _dataOffset;
        actionType = _actionType;
        callbackSelector = _callbackSelector;
        maxExecutions = _maxExecutions;

        if (!vm) {
            service.subscribe(
                _originChainId,
                _originContract,
                _topic0,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        if (maxExecutions > 0 && executionCount >= maxExecutions) return;
        if (!_evaluateCondition(log)) return;

        bytes memory payload;
        if (actionType == 0) {
            // alertCallback: topic1 = reactive contract address (for per-flow filtering)
            payload = abi.encodeWithSignature(
                "alertCallback(address,uint256,uint256,bytes)",
                address(0),
                uint256(uint160(address(this))),
                uint256(0),
                ""
            );
        } else {
            // Generic callback with custom selector
            payload = abi.encodeWithSelector(
                callbackSelector,
                address(0)
            );
        }

        emit Callback(destinationChainId, destinationContract, CALLBACK_GAS_LIMIT, payload);
        executionCount++;
        emit FlowTriggered(log.chain_id, executionCount);
    }

    function _evaluateCondition(LogRecord calldata log) internal view returns (bool) {
        if (conditionOp == 0) return true;

        uint256 offset = uint256(dataOffset) * 32;
        if (log.data.length < offset + 32) return false;

        uint256 value;
        bytes calldata slice = log.data[offset:offset + 32];
        value = abi.decode(slice, (uint256));

        if (conditionOp == 1) return value > threshold;
        if (conditionOp == 2) return value < threshold;
        if (conditionOp == 3) return value >= threshold;
        if (conditionOp == 4) return value <= threshold;
        if (conditionOp == 5) return value == threshold;
        if (conditionOp == 6) return value != threshold;
        return false;
    }
}
