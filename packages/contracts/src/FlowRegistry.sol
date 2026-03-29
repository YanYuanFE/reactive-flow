// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/**
 * @title FlowRegistry
 * @notice Storage-only registry for user flows.
 *         ReactiveFlowEngine is deployed directly by the user's wallet (EOA),
 *         then registered here for indexing.
 */
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

    mapping(address => FlowInfo[]) public userFlows;
    mapping(address => uint256) public userFlowCount;
    address[] public allFlows;

    event FlowRegistered(
        address indexed owner,
        address indexed reactiveContract,
        string name,
        uint256 originChainId,
        uint256 destinationChainId
    );

    function registerFlow(
        address _reactiveContract,
        string memory _name,
        uint256 _originChainId,
        address _originContract,
        uint256 _destinationChainId,
        address _destinationContract,
        uint8 _conditionOp,
        uint256 _threshold,
        uint8 _actionType
    ) external {
        userFlows[msg.sender].push(FlowInfo({
            reactiveContract: _reactiveContract,
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
        allFlows.push(_reactiveContract);

        emit FlowRegistered(msg.sender, _reactiveContract, _name, _originChainId, _destinationChainId);
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
