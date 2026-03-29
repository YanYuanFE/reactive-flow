// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import 'forge-std/Script.sol';
import '../src/ReactiveFlowEngine.sol';

contract DeployReactive is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 fundAmount = vm.envOr("FUND_AMOUNT", uint256(0.1 ether));

        // Flow config from env vars
        string memory flowName = vm.envString("FLOW_NAME");
        uint256 originChainId = vm.envUint("ORIGIN_CHAIN_ID");
        address originContract = vm.envAddress("ORIGIN_CONTRACT");
        uint256 eventTopic0 = vm.envUint("EVENT_TOPIC0");
        uint256 destChainId = vm.envUint("DEST_CHAIN_ID");
        address destContract = vm.envAddress("DEST_CONTRACT");

        // Condition config
        uint8 conditionOp = uint8(vm.envUint("CONDITION_OP"));
        uint256 threshold = vm.envUint("THRESHOLD");
        uint8 dataOffset = uint8(vm.envUint("DATA_OFFSET"));

        // Action config
        uint8 actionType = uint8(vm.envUint("ACTION_TYPE"));
        bytes4 callbackSelector = bytes4(bytes32(vm.envUint("CALLBACK_SELECTOR")));
        uint256 maxExecutions = vm.envUint("MAX_EXECUTIONS");

        vm.startBroadcast(deployerPrivateKey);

        ReactiveFlowEngine engine = new ReactiveFlowEngine{value: fundAmount}(
            flowName,
            originChainId,
            originContract,
            eventTopic0,
            destChainId,
            destContract,
            conditionOp,
            threshold,
            dataOffset,
            actionType,
            callbackSelector,
            maxExecutions
        );

        vm.stopBroadcast();

        console.log("ReactiveFlowEngine deployed at:", address(engine));
        console.log("Flow name:", flowName);
        console.log("Origin chain:", originChainId);
        console.log("Origin contract:", originContract);
        console.log("Dest chain:", destChainId);
        console.log("Dest contract:", destContract);
    }
}
