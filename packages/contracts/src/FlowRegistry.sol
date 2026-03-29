// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import './ReactiveFlowEngine.sol';

contract FlowRegistry {
    struct FlowInfo {
        address reactiveContract;
        string name;
        uint256 originChainId;
        address originContract;
        uint256 destinationChainId;
        address destinationContract;
        uint8 conditionOp;
        uint256 threshold;
        uint8 actionType;
        uint256 createdAt;
    }

    // owner => flows
    mapping(address => FlowInfo[]) public userFlows;
    // owner => flow count
    mapping(address => uint256) public userFlowCount;
    // all deployed reactive contracts
    address[] public allFlows;

    event FlowCreated(
        address indexed owner,
        address indexed reactiveContract,
        string name,
        uint256 originChainId,
        uint256 destinationChainId
    );

    function createFlow(
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
    ) external payable returns (address) {
        ReactiveFlowEngine engine = new ReactiveFlowEngine{value: msg.value}(
            _name,
            _originChainId,
            _originContract,
            _topic0,
            _destinationChainId,
            _destinationContract,
            _conditionOp,
            _threshold,
            _dataOffset,
            _actionType,
            _callbackSelector,
            _maxExecutions
        );

        address engineAddr = address(engine);

        userFlows[msg.sender].push(FlowInfo({
            reactiveContract: engineAddr,
            name: _name,
            originChainId: _originChainId,
            originContract: _originContract,
            destinationChainId: _destinationChainId,
            destinationContract: _destinationContract,
            conditionOp: _conditionOp,
            threshold: _threshold,
            actionType: _actionType,
            createdAt: block.timestamp
        }));

        userFlowCount[msg.sender]++;
        allFlows.push(engineAddr);

        emit FlowCreated(msg.sender, engineAddr, _name, _originChainId, _destinationChainId);

        return engineAddr;
    }

    function getUserFlows(address user) external view returns (FlowInfo[] memory) {
        return userFlows[user];
    }

    function getUserFlowCount(address user) external view returns (uint256) {
        return userFlowCount[user];
    }

    function getTotalFlows() external view returns (uint256) {
        return allFlows.length;
    }
}
