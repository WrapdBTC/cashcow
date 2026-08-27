// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @title MockMILK
/// @notice Test / local $MILK ERC-20 with public mint and burn.
contract MockMILK is ERC20, ERC20Burnable {
    constructor() ERC20("Milk", "MILK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
