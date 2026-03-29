// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import 'forge-std/Script.sol';
import '../src/FlowOrigin.sol';

contract TriggerDemo is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address originContract = vm.envAddress("ORIGIN_CONTRACT");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 amount = vm.envUint("AMOUNT");

        vm.startBroadcast(deployerPrivateKey);

        FlowOrigin origin = FlowOrigin(originContract);
        origin.simulateTransfer(recipient, amount);

        vm.stopBroadcast();

        console.log("Triggered simulateTransfer on:", originContract);
        console.log("Recipient:", recipient);
        console.log("Amount:", amount);
    }
}
