// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

import {CashCows} from "../src/CashCows.sol";
import {FeeSplitter} from "../src/FeeSplitter.sol";
import {ClockIn} from "../src/ClockIn.sol";
import {MockMILK} from "../src/MockMILK.sol";

contract CashCowsTest is Test {
    MockMILK internal milk;
    CashCows internal cows;
    FeeSplitter internal splitter;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal royalty = makeAddr("royalty");

    uint256 internal constant PRICE = 1 ether;

    function setUp() public {
        milk = new MockMILK();
        cows = new CashCows(address(milk), royalty, PRICE, block.timestamp, owner);
        splitter = new FeeSplitter(address(cows), owner);
        vm.prank(owner);
        cows.setClockIn(address(splitter));

        milk.mint(alice, 1_000 ether);
        milk.mint(bob, 1_000 ether);
        vm.prank(alice);
        milk.approve(address(cows), type(uint256).max);
        vm.prank(bob);
        milk.approve(address(cows), type(uint256).max);
    }

    function _ids(uint256 a) internal pure returns (uint256[] memory ids) {
        ids = new uint256[](1);
        ids[0] = a;
    }

    function _ids(uint256 a, uint256 b) internal pure returns (uint256[] memory ids) {
        ids = new uint256[](2);
        ids[0] = a;
        ids[1] = b;
    }

    // -------------------------------------------------------------------------
    // Mint
    // -------------------------------------------------------------------------

    function test_MintBurnsMilk() public {
        uint256 supplyBefore = milk.totalSupply();
        uint256 aliceBefore = milk.balanceOf(alice);

        vm.prank(alice);
        uint256 tokenId = cows.mint();

        assertEq(tokenId, 1);
        assertEq(cows.ownerOf(1), alice);
        assertEq(cows.totalSupply(), 1);
        assertEq(milk.totalSupply(), supplyBefore - PRICE);
        assertEq(milk.balanceOf(alice), aliceBefore - PRICE);
        assertEq(milk.balanceOf(address(cows)), 0);
        assertGt(cows.milkWeight(1), 0);
    }

    function test_MintWithWeightBurnsMilk() public {
        uint256 supplyBefore = milk.totalSupply();
        vm.prank(alice);
        uint256 tokenId = cows.mint(uint16(200), uint8(0));
        assertEq(tokenId, 1);
        assertEq(cows.milkWeight(1), 200);
        assertEq(cows.breedOf(1), 0);
        assertEq(cows.gradeOf(1), cows.GRADE_CUSTOM());
        assertEq(milk.totalSupply(), supplyBefore - PRICE);
    }

    function test_MaxThreePerWallet() public {
        vm.startPrank(alice);
        cows.mint();
        cows.mint();
        cows.mint();
        vm.expectRevert(CashCows.MaxPerWallet.selector);
        cows.mint();
        vm.stopPrank();
        assertEq(cows.balanceOf(alice), 3);
        assertEq(cows.mintedCount(alice), 3);
    }

    function test_MaxSupply2222() public {
        vm.startPrank(owner);
        for (uint256 i; i < 2222; ++i) {
            cows.ownerMint(owner, 100, 0);
        }
        vm.expectRevert(CashCows.SoldOut.selector);
        cows.ownerMint(owner, 100, 0);
        vm.stopPrank();
        assertEq(cows.totalSupply(), 2222);
        assertEq(cows.MAX_SUPPLY(), 2222);
    }

    function test_MintOpenGate() public {
        vm.prank(owner);
        cows.setMintOpen(block.timestamp + 1 days);

        vm.prank(alice);
        vm.expectRevert(CashCows.MintClosed.selector);
        cows.mint();

        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        uint256 id = cows.mint();
        assertEq(id, 1);
    }

    function test_MintClosedWhenMintOpenZero() public {
        vm.prank(owner);
        cows.setMintOpen(0);
        vm.prank(alice);
        vm.expectRevert(CashCows.MintClosed.selector);
        cows.mint();
    }

    function test_RarityTableCounts() public {
        assertEq(cows.remainingByGrade(0), 1111);
        assertEq(cows.remainingByGrade(1), 622);
        assertEq(cows.remainingByGrade(2), 311);
        assertEq(cows.remainingByGrade(3), 133);
        assertEq(cows.remainingByGrade(4), 34);
        assertEq(cows.remainingByGrade(5), 11);
        assertEq(cows.remainingTableSupply(), 2222);
        assertTrue(cows.sacredClaimed(cows.BREED_DEXTER()));
        assertEq(cows.WEIGHT_SKIM(), 100);
        assertEq(cows.WEIGHT_TWO_PERCENT(), 125);
        assertEq(cows.WEIGHT_WHOLE(), 160);
        assertEq(cows.WEIGHT_EXTRA_HEAVY(), 220);
        assertEq(cows.WEIGHT_GOLDEN(), 350);
        assertEq(cows.WEIGHT_SACRED(), 500);
        assertEq(cows.breedName(6), "Dexter");
        assertEq(cows.breedName(11), "BelgianBlue");
        assertEq(cows.gradeName(0), "Skim");
    }

    function test_PublicMintConsumesRarityTable() public {
        uint256 before_ = cows.remainingTableSupply();
        vm.prank(alice);
        cows.mint();
        assertEq(cows.remainingTableSupply(), before_ - 1);
    }

    // -------------------------------------------------------------------------
    // Clock in / out
    // -------------------------------------------------------------------------

    function test_ClockInAndOut() public {
        vm.prank(owner);
        uint256 id = cows.ownerMint(alice, 100, 0);

        vm.prank(alice);
        splitter.clockIn(id);
        assertTrue(splitter.isClockedIn(id));
        assertEq(splitter.clockedWeight(id), 100);
        assertEq(splitter.totalClockedWeight(), 100);

        vm.prank(alice);
        splitter.clockOut(id);
        assertFalse(splitter.isClockedIn(id));
        assertEq(splitter.clockedWeight(id), 0);
        assertEq(splitter.totalClockedWeight(), 0);
    }

    function test_ClockInRequiresOwner() public {
        vm.prank(owner);
        uint256 id = cows.ownerMint(alice, 100, 0);
        vm.prank(bob);
        vm.expectRevert(ClockIn.NotTokenOwner.selector);
        splitter.clockIn(id);
    }

    function test_TransferRevertsWhileClockedIn() public {
        vm.prank(owner);
        uint256 id = cows.ownerMint(alice, 100, 0);
        vm.prank(alice);
        splitter.clockIn(id);
        vm.prank(alice);
        vm.expectRevert(CashCows.TokenClockedIn.selector);
        cows.transferFrom(alice, bob, id);
    }

    function test_TransferOkAfterClockOut() public {
        vm.prank(owner);
        uint256 id = cows.ownerMint(alice, 100, 0);
        vm.startPrank(alice);
        splitter.clockIn(id);
        splitter.clockOut(id);
        cows.transferFrom(alice, bob, id);
        vm.stopPrank();
        assertEq(cows.ownerOf(id), bob);
    }

    // -------------------------------------------------------------------------
    // Fee splitter
    // -------------------------------------------------------------------------

    function test_UnstakedTokensGetZeroShare() public {
        vm.startPrank(owner);
        uint256 aliceId = cows.ownerMint(alice, 100, 0);
        uint256 bobId = cows.ownerMint(bob, 200, 1);
        vm.stopPrank();

        vm.prank(alice);
        splitter.clockIn(aliceId);
        // bob stays unstaked

        vm.deal(address(this), 3 ether);
        (bool ok,) = address(splitter).call{value: 3 ether}("");
        assertTrue(ok);

        assertEq(splitter.pending(aliceId), 3 ether);
        assertEq(splitter.pending(bobId), 0);
        assertEq(splitter.clockedWeight(bobId), 0);
        assertEq(splitter.claimable(bob, _ids(bobId)), 0);
        assertEq(splitter.claimable(alice, _ids(aliceId)), 3 ether);

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        splitter.claim(_ids(aliceId));
        assertEq(alice.balance - aliceBefore, 3 ether);

        vm.prank(bob);
        vm.expectRevert(FeeSplitter.NothingToClaim.selector);
        splitter.claim(_ids(bobId));
    }

    function test_TwoClockedInTokensSplitByWeight() public {
        vm.startPrank(owner);
        uint256 aliceId = cows.ownerMint(alice, 100, 0);
        uint256 bobId = cows.ownerMint(bob, 200, 1);
        vm.stopPrank();

        vm.prank(alice);
        splitter.clockIn(aliceId);
        vm.prank(bob);
        splitter.clockIn(bobId);

        vm.deal(address(this), 3 ether);
        (bool ok,) = address(splitter).call{value: 3 ether}("");
        assertTrue(ok);

        assertEq(splitter.pending(aliceId), 1 ether);
        assertEq(splitter.pending(bobId), 2 ether);

        uint256 aliceBefore = alice.balance;
        uint256 bobBefore = bob.balance;
        vm.prank(alice);
        splitter.claim(_ids(aliceId));
        vm.prank(bob);
        splitter.claim(_ids(bobId));
        assertEq(alice.balance - aliceBefore, 1 ether);
        assertEq(bob.balance - bobBefore, 2 ether);
    }

    function test_ClockOutKeepsPriorShareAndGetsZeroAfter() public {
        vm.startPrank(owner);
        uint256 aliceId = cows.ownerMint(alice, 100, 0);
        uint256 bobId = cows.ownerMint(bob, 100, 1);
        vm.stopPrank();

        vm.prank(alice);
        splitter.clockIn(aliceId);
        vm.prank(bob);
        splitter.clockIn(bobId);

        vm.deal(address(this), 4 ether);
        (bool ok,) = address(splitter).call{value: 2 ether}("");
        assertTrue(ok);

        vm.prank(alice);
        splitter.clockOut(aliceId);
        assertEq(splitter.pending(aliceId), 0);

        (ok,) = address(splitter).call{value: 2 ether}("");
        assertTrue(ok);

        // alice: 1 ether from first drop (realized on clock-out); 0 of second drop
        assertEq(splitter.claimable(alice, _ids(aliceId)), 1 ether);
        assertEq(splitter.pending(aliceId), 0);
        assertEq(splitter.pending(bobId), 1 ether + 2 ether);

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        splitter.claim(_ids(aliceId));
        assertEq(alice.balance - aliceBefore, 1 ether);
    }

    // -------------------------------------------------------------------------
    // Royalty
    // -------------------------------------------------------------------------

    function test_RoyaltyInfoFivePercent() public {
        (address recv, uint256 amount) = cows.royaltyInfo(1, 10_000);
        assertEq(recv, royalty);
        assertEq(amount, 500); // 5% of 10000
        assertTrue(cows.supportsInterface(type(IERC2981).interfaceId));
    }

    function test_SetBaseURI() public {
        vm.prank(owner);
        cows.setBaseURI("ipfs://herd/");
        vm.prank(owner);
        cows.ownerMint(alice, 100, 0);
        assertEq(cows.tokenURI(1), "ipfs://herd/1");
    }
}
