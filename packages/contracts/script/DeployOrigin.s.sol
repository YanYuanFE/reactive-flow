// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import 'forge-std/Script.sol';
import '../src/FlowOrigin.sol';

contract DeployOrigin is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        FlowOrigin origin = new FlowOrigin();

        vm.stopBroadcast();

        console.log("FlowOrigin deployed at:", address(origin));
        console.log("Chain ID:", block.chainid);
    }
}
