// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MilkWeight
/// @notice Per-token milk weight stored as hundredths of 1x (1.0x = 100).
/// @dev Grades: Skim 100, 2% Milk 125, Whole 160, Extra Heavy 220, Golden 350, Sacred 500.
///      Intended counts: 1111 / 622 / 311 / 133 / 34 / 11 (total 2222).
///      11 Sacred 1/1s, one per breed except Dexter.
abstract contract MilkWeight {
    uint8 public constant GRADE_SKIM = 0;
    uint8 public constant GRADE_TWO_PERCENT = 1;
    uint8 public constant GRADE_WHOLE = 2;
    uint8 public constant GRADE_EXTRA_HEAVY = 3;
    uint8 public constant GRADE_GOLDEN = 4;
    uint8 public constant GRADE_SACRED = 5;
    uint8 public constant GRADE_COUNT = 6;
    uint8 public constant GRADE_CUSTOM = type(uint8).max;

    uint16 public constant WEIGHT_SKIM = 100;
    uint16 public constant WEIGHT_TWO_PERCENT = 125;
    uint16 public constant WEIGHT_WHOLE = 160;
    uint16 public constant WEIGHT_EXTRA_HEAVY = 220;
    uint16 public constant WEIGHT_GOLDEN = 350;
    uint16 public constant WEIGHT_SACRED = 500;

    uint16 public constant COUNT_SKIM = 1111;
    uint16 public constant COUNT_TWO_PERCENT = 622;
    uint16 public constant COUNT_WHOLE = 311;
    uint16 public constant COUNT_EXTRA_HEAVY = 133;
    uint16 public constant COUNT_GOLDEN = 34;
    uint16 public constant COUNT_SACRED = 11;

    uint8 public constant BREED_HOLSTEIN = 0;
    uint8 public constant BREED_ANGUS = 1;
    uint8 public constant BREED_HIGHLAND = 2;
    uint8 public constant BREED_LONGHORN = 3;
    uint8 public constant BREED_ANKOLE = 4;
    uint8 public constant BREED_BRAHMAN = 5;
    uint8 public constant BREED_DEXTER = 6;
    uint8 public constant BREED_JERSEY = 7;
    uint8 public constant BREED_GALLOWAY = 8;
    uint8 public constant BREED_BUFFALO = 9;
    uint8 public constant BREED_YAK = 10;
    uint8 public constant BREED_BELGIAN_BLUE = 11;
    uint8 public constant BREED_COUNT = 12;

    /// @notice Remaining mints per grade in the public rarity table.
    uint16[6] public remainingByGrade;

    /// @notice Whether the Sacred 1/1 for a breed has been assigned. Dexter starts claimed.
    bool[12] public sacredClaimed;

    /// @notice Weight in hundredths of 1x (uint16; 100 = 1.0x).
    mapping(uint256 => uint16) public milkWeight;

    mapping(uint256 => uint8) public gradeOf;
    mapping(uint256 => uint8) public breedOf;

    error InvalidGrade();
    error InvalidBreed();
    error InvalidWeight();
    error RarityTableEmpty();
    error NoSacredBreedLeft();

    event WeightSet(uint256 indexed tokenId, uint16 weight, uint8 grade, uint8 breed);

    constructor() {
        remainingByGrade[GRADE_SKIM] = COUNT_SKIM;
        remainingByGrade[GRADE_TWO_PERCENT] = COUNT_TWO_PERCENT;
        remainingByGrade[GRADE_WHOLE] = COUNT_WHOLE;
        remainingByGrade[GRADE_EXTRA_HEAVY] = COUNT_EXTRA_HEAVY;
        remainingByGrade[GRADE_GOLDEN] = COUNT_GOLDEN;
        remainingByGrade[GRADE_SACRED] = COUNT_SACRED;
        // 11 Sacred 1/1s: one per breed except Dexter.
        sacredClaimed[BREED_DEXTER] = true;
    }

    function weightOfGrade(uint8 grade) public pure returns (uint16) {
        if (grade == GRADE_SKIM) return WEIGHT_SKIM;
        if (grade == GRADE_TWO_PERCENT) return WEIGHT_TWO_PERCENT;
        if (grade == GRADE_WHOLE) return WEIGHT_WHOLE;
        if (grade == GRADE_EXTRA_HEAVY) return WEIGHT_EXTRA_HEAVY;
        if (grade == GRADE_GOLDEN) return WEIGHT_GOLDEN;
        if (grade == GRADE_SACRED) return WEIGHT_SACRED;
        revert InvalidGrade();
    }

    function gradeFromWeight(uint16 weight) public pure returns (uint8) {
        if (weight == WEIGHT_SKIM) return GRADE_SKIM;
        if (weight == WEIGHT_TWO_PERCENT) return GRADE_TWO_PERCENT;
        if (weight == WEIGHT_WHOLE) return GRADE_WHOLE;
        if (weight == WEIGHT_EXTRA_HEAVY) return GRADE_EXTRA_HEAVY;
        if (weight == WEIGHT_GOLDEN) return GRADE_GOLDEN;
        if (weight == WEIGHT_SACRED) return GRADE_SACRED;
        return GRADE_CUSTOM;
    }

    function gradeName(uint8 grade) public pure returns (string memory) {
        if (grade == GRADE_SKIM) return "Skim";
        if (grade == GRADE_TWO_PERCENT) return "2% Milk";
        if (grade == GRADE_WHOLE) return "Whole";
        if (grade == GRADE_EXTRA_HEAVY) return "Extra Heavy";
        if (grade == GRADE_GOLDEN) return "Golden";
        if (grade == GRADE_SACRED) return "Sacred";
        if (grade == GRADE_CUSTOM) return "Custom";
        revert InvalidGrade();
    }

    function breedName(uint8 breed) public pure returns (string memory) {
        if (breed == BREED_HOLSTEIN) return "Holstein";
        if (breed == BREED_ANGUS) return "Angus";
        if (breed == BREED_HIGHLAND) return "Highland";
        if (breed == BREED_LONGHORN) return "Longhorn";
        if (breed == BREED_ANKOLE) return "Ankole";
        if (breed == BREED_BRAHMAN) return "Brahman";
        if (breed == BREED_DEXTER) return "Dexter";
        if (breed == BREED_JERSEY) return "Jersey";
        if (breed == BREED_GALLOWAY) return "Galloway";
        if (breed == BREED_BUFFALO) return "Buffalo";
        if (breed == BREED_YAK) return "Yak";
        if (breed == BREED_BELGIAN_BLUE) return "BelgianBlue";
        revert InvalidBreed();
    }

    function remainingTableSupply() public view returns (uint256 total) {
        for (uint256 i; i < GRADE_COUNT; ++i) {
            total += remainingByGrade[i];
        }
    }

    function _assignFromTable(uint256 tokenId, uint256 entropy) internal returns (uint16 weight, uint8 grade, uint8 breed) {
        uint256 remaining = remainingTableSupply();
        if (remaining == 0) revert RarityTableEmpty();

        uint256 roll = entropy % remaining;
        uint256 acc;
        grade = GRADE_SKIM;
        for (uint8 g; g < GRADE_COUNT; ++g) {
            acc += remainingByGrade[g];
            if (roll < acc) {
                grade = g;
                break;
            }
        }

        unchecked {
            remainingByGrade[grade] -= 1;
        }
        weight = weightOfGrade(grade);

        if (grade == GRADE_SACRED) {
            breed = _assignSacredBreed(entropy >> 16);
        } else {
            breed = uint8(uint256(keccak256(abi.encodePacked(entropy, tokenId))) % BREED_COUNT);
        }

        milkWeight[tokenId] = weight;
        gradeOf[tokenId] = grade;
        breedOf[tokenId] = breed;
        emit WeightSet(tokenId, weight, grade, breed);
    }

    /// @notice Set an arbitrary weight at mint (minter/owner path). Does not consume the rarity table.
    function _setWeightAtMint(uint256 tokenId, uint16 weight, uint8 breed) internal {
        if (weight == 0) revert InvalidWeight();
        if (breed >= BREED_COUNT) revert InvalidBreed();
        uint8 grade = gradeFromWeight(weight);
        milkWeight[tokenId] = weight;
        gradeOf[tokenId] = grade;
        breedOf[tokenId] = breed;
        emit WeightSet(tokenId, weight, grade, breed);
    }

    function _assignSacredBreed(uint256 entropy) internal returns (uint8 breed) {
        uint8 n;
        uint8[11] memory available;
        for (uint8 b; b < BREED_COUNT; ++b) {
            if (!sacredClaimed[b]) {
                available[n] = b;
                unchecked {
                    ++n;
                }
            }
        }
        if (n == 0) revert NoSacredBreedLeft();
        breed = available[entropy % n];
        sacredClaimed[breed] = true;
    }
}
