// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMilkWeight {
    function milkWeight(uint256 tokenId) external view returns (uint16);
    function gradeOf(uint256 tokenId) external view returns (uint8);
    function breedOf(uint256 tokenId) external view returns (uint8);
}
