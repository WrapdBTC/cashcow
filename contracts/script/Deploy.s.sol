// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CashCows} from "../src/CashCows.sol";
import {FeeSplitter} from "../src/FeeSplitter.sol";
import {MockMILK} from "../src/MockMILK.sol";

/// @notice Deploy CashCows + FeeSplitter. Addresses are env-configurable.
///
/// Env (all optional except PRIVATE_KEY for broadcast):
///   MILK              existing $MILK token; if unset, deploys MockMILK
///   ROYALTY_RECEIVER  ERC-2981 receiver (default: broadcaster)
///   OWNER             Ownable owner (default: broadcaster)
///   MINT_PRICE        $MILK amount burned per public mint (default: 1e18)
///   MINT_OPEN         unix timestamp; 0 = closed until owner sets (default: 0)
///   BASE_URI          token URI prefix
///
/// Robinhood Chain: chainId 4663 (mainnet), 46630 (testnet).
contract Deploy is Script {
    uint256 public constant ROBINHOOD_MAINNET = 4663;
    uint256 public constant ROBINHOOD_TESTNET = 46630;

    function run() external {
        address deployer = msg.sender;
        address milk = vm.envOr("MILK", address(0));
        address royalty = vm.envOr("ROYALTY_RECEIVER", deployer);
        address owner_ = vm.envOr("OWNER", deployer);
        uint256 mintPrice = vm.envOr("MINT_PRICE", uint256(1 ether));
        uint256 mintOpen = vm.envOr("MINT_OPEN", uint256(0));
        string memory baseURI = vm.envOr("BASE_URI", string(""));

        vm.startBroadcast();

        if (milk == address(0)) {
            MockMILK mock = new MockMILK();
            milk = address(mock);
            console2.log("MockMILK", milk);
        }

        CashCows cows = new CashCows(milk, royalty, mintPrice, mintOpen, owner_);
        FeeSplitter splitter = new FeeSplitter(address(cows), owner_);

        if (owner_ == deployer) {
            cows.setClockIn(address(splitter));
            if (bytes(baseURI).length > 0) {
                cows.setBaseURI(baseURI);
            }
        }

        vm.stopBroadcast();

        console2.log("chainId", block.chainid);
        console2.log("CashCows", address(cows));
        console2.log("FeeSplitter", address(splitter));
        console2.log("MILK", milk);
        console2.log("owner", owner_);
        console2.log("royalty", royalty);
        console2.log("mintPrice", mintPrice);
        console2.log("mintOpen", mintOpen);
        if (block.chainid == ROBINHOOD_MAINNET) {
            console2.log("network Robinhood Chain mainnet (4663)");
        } else if (block.chainid == ROBINHOOD_TESTNET) {
            console2.log("network Robinhood Chain testnet (46630)");
        }
        if (owner_ != deployer) {
            console2.log("NOTE: OWNER != deployer; call CashCows.setClockIn(FeeSplitter) as owner");
        }
    }
}
