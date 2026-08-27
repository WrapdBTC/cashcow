// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {MilkWeight} from "./MilkWeight.sol";
import {IClockIn} from "./interfaces/IClockIn.sol";
import {IERC20Burnable} from "./interfaces/IERC20Burnable.sol";

/// @title CashCows
/// @notice ERC-721 herd (max 2222, max 3 minted per wallet) with ERC-2981 5% royalty.
///         Public mint spends $MILK and burns 100% of the payment. Gated by `mintOpen`.
contract CashCows is ERC721, ERC2981, Ownable, MilkWeight {
    uint256 public constant MAX_SUPPLY = 2222;
    uint256 public constant MAX_PER_WALLET = 3;
    uint96 public constant ROYALTY_FEE_NUMERATOR = 500; // 5% of 10000

    IERC20Burnable public milk;
    uint256 public mintPrice;
    /// @notice Unix timestamp when public mint opens. 0 = closed.
    uint256 public mintOpen;
    string public baseTokenURI;
    uint256 public totalMinted;
    mapping(address => uint256) public mintedCount;

    /// @notice ClockIn / FeeSplitter used to lock transfers of clocked-in tokens.
    address public clockIn;

    error MintClosed();
    error SoldOut();
    error MaxPerWallet();
    error TokenClockedIn();
    error ZeroAddress();

    event MilkUpdated(address indexed milk);
    event MintPriceUpdated(uint256 price);
    event MintOpenUpdated(uint256 timestamp);
    event BaseURIUpdated(string uri);
    event ClockInUpdated(address indexed clockIn);
    event CowMinted(address indexed to, uint256 indexed tokenId, uint16 weight, uint8 grade, uint8 breed);

    constructor(
        address milk_,
        address royaltyReceiver_,
        uint256 mintPrice_,
        uint256 mintOpen_,
        address owner_
    ) ERC721("Cash Cows", "COW") Ownable(owner_) {
        if (milk_ == address(0) || royaltyReceiver_ == address(0) || owner_ == address(0)) {
            revert ZeroAddress();
        }
        milk = IERC20Burnable(milk_);
        mintPrice = mintPrice_;
        mintOpen = mintOpen_;
        _setDefaultRoyalty(royaltyReceiver_, ROYALTY_FEE_NUMERATOR);
    }

    // -------------------------------------------------------------------------
    // Mint
    // -------------------------------------------------------------------------

    /// @notice Public mint. Assigns grade/breed/weight from the rarity table. Burns 100% of $MILK paid.
    function mint() external returns (uint256 tokenId) {
        _requireMintOpen();
        tokenId = _mintCore(msg.sender, true);
        uint256 entropy = uint256(
            keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, tokenId, totalMinted))
        );
        (uint16 weight, uint8 grade, uint8 breed) = _assignFromTable(tokenId, entropy);
        emit CowMinted(msg.sender, tokenId, weight, grade, breed);
    }

    /// @notice Minter-specified weight (hundredths of 1x) and breed. Burns $MILK like public mint.
    /// @dev Weight 200 is allowed (tests / custom); it is stored as grade Custom.
    function mint(uint16 weight, uint8 breed) external returns (uint256 tokenId) {
        _requireMintOpen();
        tokenId = _mintCore(msg.sender, true);
        _setWeightAtMint(tokenId, weight, breed);
        emit CowMinted(msg.sender, tokenId, weight, gradeOf[tokenId], breed);
    }

    /// @notice Owner mint with explicit weight/breed. Skips mintOpen, per-wallet cap, and $MILK burn.
    function ownerMint(address to, uint16 weight, uint8 breed) external onlyOwner returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddress();
        tokenId = _mintCore(to, false);
        _setWeightAtMint(tokenId, weight, breed);
        emit CowMinted(to, tokenId, weight, gradeOf[tokenId], breed);
    }

    function _requireMintOpen() internal view {
        if (mintOpen == 0 || block.timestamp < mintOpen) revert MintClosed();
    }

    function _mintCore(address to, bool enforceWalletCap) internal returns (uint256 tokenId) {
        if (totalMinted >= MAX_SUPPLY) revert SoldOut();
        if (enforceWalletCap) {
            if (mintedCount[to] >= MAX_PER_WALLET) revert MaxPerWallet();
            uint256 price = mintPrice;
            if (price > 0) {
                milk.burnFrom(to, price);
            }
            unchecked {
                mintedCount[to] += 1;
            }
        }
        unchecked {
            tokenId = ++totalMinted;
        }
        _safeMint(to, tokenId);
    }

    function totalSupply() public view returns (uint256) {
        return totalMinted;
    }

    // -------------------------------------------------------------------------
    // Token URI / config
    // -------------------------------------------------------------------------

    function setBaseURI(string calldata uri) external onlyOwner {
        baseTokenURI = uri;
        emit BaseURIUpdated(uri);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function setMilk(address milk_) external onlyOwner {
        if (milk_ == address(0)) revert ZeroAddress();
        milk = IERC20Burnable(milk_);
        emit MilkUpdated(milk_);
    }

    function setMintPrice(uint256 price) external onlyOwner {
        mintPrice = price;
        emit MintPriceUpdated(price);
    }

    function setMintOpen(uint256 timestamp) external onlyOwner {
        mintOpen = timestamp;
        emit MintOpenUpdated(timestamp);
    }

    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setClockIn(address clockIn_) external onlyOwner {
        clockIn = clockIn_;
        emit ClockInUpdated(clockIn_);
    }

    // -------------------------------------------------------------------------
    // Transfers: lock clocked-in tokens
    // -------------------------------------------------------------------------

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            address gate = clockIn;
            if (gate != address(0) && IClockIn(gate).isClockedIn(tokenId)) {
                revert TokenClockedIn();
            }
        }
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
