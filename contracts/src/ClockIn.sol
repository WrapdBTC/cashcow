// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IClockIn} from "./interfaces/IClockIn.sol";
import {IMilkWeight} from "./interfaces/IMilkWeight.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title ClockIn
/// @notice Stake / unstake registry. Unstaked milk weight does not count toward the fee splitter.
abstract contract ClockIn is IClockIn {
    IERC721 public immutable cows;
    IMilkWeight public immutable weights;

    mapping(uint256 => bool) internal _clockedIn;
    mapping(uint256 => uint256) internal _clockedWeight;
    uint256 public override totalClockedWeight;

    error NotTokenOwner();
    error AlreadyClockedIn();
    error NotClockedIn();
    error ZeroWeight();

    event ClockedIn(address indexed owner, uint256 indexed tokenId, uint256 weight);
    event ClockedOut(address indexed owner, uint256 indexed tokenId, uint256 weight);

    constructor(address cows_) {
        cows = IERC721(cows_);
        weights = IMilkWeight(cows_);
    }

    function isClockedIn(uint256 tokenId) public view override returns (bool) {
        return _clockedIn[tokenId];
    }

    /// @notice Weight that currently counts toward the splitter. Unstaked tokens return 0.
    function clockedWeight(uint256 tokenId) public view override returns (uint256) {
        return _clockedIn[tokenId] ? _clockedWeight[tokenId] : 0;
    }

    function _clockIn(uint256 tokenId) internal returns (uint256 weight) {
        if (cows.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (_clockedIn[tokenId]) revert AlreadyClockedIn();
        weight = uint256(weights.milkWeight(tokenId));
        if (weight == 0) revert ZeroWeight();
        _clockedIn[tokenId] = true;
        _clockedWeight[tokenId] = weight;
        totalClockedWeight += weight;
        emit ClockedIn(msg.sender, tokenId, weight);
    }

    function _clockOut(uint256 tokenId) internal returns (uint256 weight) {
        if (cows.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!_clockedIn[tokenId]) revert NotClockedIn();
        weight = _clockedWeight[tokenId];
        _clockedIn[tokenId] = false;
        _clockedWeight[tokenId] = 0;
        totalClockedWeight -= weight;
        emit ClockedOut(msg.sender, tokenId, weight);
    }
}
