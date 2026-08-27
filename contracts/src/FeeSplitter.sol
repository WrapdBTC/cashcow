// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {ClockIn} from "./ClockIn.sol";

/// @title FeeSplitter
/// @notice Pull-pattern ETH splitter. Clocked-in owners claim a share of accrued ETH
///         proportional to milk weight. Unstaked weight is 0. No APY, rebase, or streaming.
contract FeeSplitter is ClockIn, ReentrancyGuard, Ownable {
    uint256 public constant PRECISION = 1e18;

    /// @notice Accumulator: ETH per unit of clocked-in weight, scaled by PRECISION.
    uint256 public accEthPerWeight;
    /// @notice ETH received that has not yet been folded into `accEthPerWeight`.
    uint256 public unallocated;
    /// @notice Per-token debt = weight * accEthPerWeight / PRECISION at last checkpoint.
    mapping(uint256 => uint256) public rewardDebt;
    /// @notice ETH realized on clock-out, waiting to be pulled.
    mapping(address => uint256) public accrued;

    error NothingToClaim();
    error EthTransferFailed();

    event FeesReceived(address indexed from, uint256 amount);
    event Claimed(address indexed account, uint256 amount);

    constructor(address cows_, address owner_) ClockIn(cows_) Ownable(owner_) {}

    receive() external payable {
        _takeFees(msg.value);
    }

    /// @notice Explicit deposit helper (same as sending ETH).
    function notify() external payable {
        _takeFees(msg.value);
    }

    function _takeFees(uint256 amount) internal {
        if (amount == 0) return;
        unallocated += amount;
        _updatePool();
        emit FeesReceived(msg.sender, amount);
    }

    function _updatePool() internal {
        uint256 tw = totalClockedWeight;
        uint256 pending_ = unallocated;
        if (tw == 0 || pending_ == 0) return;
        accEthPerWeight += (pending_ * PRECISION) / tw;
        unallocated = 0;
    }

    function clockIn(uint256 tokenId) external nonReentrant {
        _updatePool();
        uint256 weight = _clockIn(tokenId);
        rewardDebt[tokenId] = (weight * accEthPerWeight) / PRECISION;
    }

    function clockOut(uint256 tokenId) external nonReentrant {
        _updatePool();
        uint256 owed = _owed(tokenId);
        if (owed > 0) {
            accrued[msg.sender] += owed;
        }
        _clockOut(tokenId);
        rewardDebt[tokenId] = 0;
    }

    /// @notice Pull accrued ETH for `tokenIds` plus any realized clock-out balance.
    function claim(uint256[] calldata tokenIds) external nonReentrant {
        _updatePool();
        uint256 total = accrued[msg.sender];
        accrued[msg.sender] = 0;
        for (uint256 i; i < tokenIds.length; ++i) {
            uint256 id = tokenIds[i];
            if (cows.ownerOf(id) != msg.sender) revert NotTokenOwner();
            if (_clockedIn[id]) {
                total += _owed(id);
                rewardDebt[id] = (_clockedWeight[id] * accEthPerWeight) / PRECISION;
            }
        }
        if (total == 0) revert NothingToClaim();
        (bool ok,) = msg.sender.call{value: total}("");
        if (!ok) revert EthTransferFailed();
        emit Claimed(msg.sender, total);
    }

    /// @notice Share currently owed to a token. Unstaked tokens return 0.
    function pending(uint256 tokenId) public view returns (uint256) {
        if (!_clockedIn[tokenId]) return 0;
        return _owedPreview(tokenId);
    }

    /// @notice Pullable ETH for `account` across `tokenIds` plus realized clock-out balance.
    function claimable(address account, uint256[] calldata tokenIds) external view returns (uint256 total) {
        total = accrued[account];
        for (uint256 i; i < tokenIds.length; ++i) {
            uint256 id = tokenIds[i];
            if (_clockedIn[id] && cows.ownerOf(id) == account) {
                total += _owedPreview(id);
            }
        }
    }

    function _owed(uint256 tokenId) internal view returns (uint256) {
        uint256 accumulated = (_clockedWeight[tokenId] * accEthPerWeight) / PRECISION;
        uint256 debt = rewardDebt[tokenId];
        return accumulated > debt ? accumulated - debt : 0;
    }

    function _owedPreview(uint256 tokenId) internal view returns (uint256) {
        uint256 acc = accEthPerWeight;
        uint256 tw = totalClockedWeight;
        uint256 pendingEth = unallocated;
        if (tw > 0 && pendingEth > 0) {
            acc += (pendingEth * PRECISION) / tw;
        }
        uint256 accumulated = (_clockedWeight[tokenId] * acc) / PRECISION;
        uint256 debt = rewardDebt[tokenId];
        return accumulated > debt ? accumulated - debt : 0;
    }
}
