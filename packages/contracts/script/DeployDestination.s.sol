// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import 'forge-std/Script.sol';
import '../src/FlowDestination.sol';

contract DeployDestination is Script {
    // Sepolia Callback Proxy:      0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA
    // Base Sepolia Callback Proxy:  0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address callbackProxy = vm.envAddress("CALLBACK_PROXY");
        uint256 fundAmount = vm.envOr("FUND_AMOUNT", uint256(0.01 ether));

        vm.startBroadcast(deployerPrivateKey);

        FlowDestination destination = new FlowDestination{value: fundAmount}(callbackProxy);

        vm.stopBroadcast();

        console.log("FlowDestination deployed at:", address(destination));
        console.log("Callback proxy:", callbackProxy);
        console.log("Chain ID:", block.chainid);
    }
}
