// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IClockIn {
    function isClockedIn(uint256 tokenId) external view returns (bool);
    function clockedWeight(uint256 tokenId) external view returns (uint256);
    function totalClockedWeight() external view returns (uint256);
}
