# Cash Cows — Foundry contracts

ERC-721 herd on **Robinhood Chain** (`chainId` **4663**) with $MILK-burn mint, milk-weight grades, clock-in staking, and a pull-pattern ETH fee splitter.

Work lives under `contracts/` only. Addresses (`$MILK`, royalty receiver, owner, mint price, `mintOpen`) are constructor/owner-configurable.

## Contracts

| File | Role |
| --- | --- |
| `src/CashCows.sol` | ERC-721, max supply **2222**, max **3 minted per wallet**, ERC-2981 **5%** royalty. Public mint burns **100%** of the $MILK paid. Gated by `mintOpen`. |
| `src/MilkWeight.sol` | Per-`tokenId` `uint16` weight in hundredths of 1x (`1.0x = 100`). Rarity table or minter-set. |
| `src/ClockIn.sol` | Stake / unstake. Unstaked weight is **0** toward the splitter. |
| `src/FeeSplitter.sol` | Pull ETH. Share = clocked-in milk weight / total clocked-in weight. No APY, rebase, or streaming. |
| `src/MockMILK.sol` | Burnable ERC-20 for tests / local deploys. |

### Milk weight grades

Stored as hundredths of 1x so `1.0x = 100`.

| Grade | Weight | Intended count |
| --- | ---: | ---: |
| Skim | 100 | 1111 |
| 2% Milk | 125 | 622 |
| Whole | 160 | 311 |
| Extra Heavy | 220 | 133 |
| Golden | 350 | 34 |
| Sacred | 500 | 11 |

Sacred 1/1s: **one per breed except Dexter**. Breed ids 0–11:

`Holstein, Angus, Highland, Longhorn, Ankole, Brahman, Dexter, Jersey, Galloway, Buffalo, Yak, BelgianBlue`

Public `mint()` draws from the remaining rarity table. `mint(uint16 weight, uint8 breed)` lets the minter set weight (still burns $MILK, still under supply / wallet caps / `mintOpen`). `ownerMint` is owner-only and skips those gates.

### Fee splitter

Send ETH to `FeeSplitter` (`receive` or `notify()`). Clocked-in owners call `claim(tokenIds)` to pull their share of accrued ETH. Unstaked tokens contribute **0** weight and earn **0** of new ETH. Prior share realized on `clockOut` remains pullable.

## Setup

`lib/` is not committed. Run `forge install` for **openzeppelin-contracts v5.2.0** and **forge-std** (see `.gitmodules`).

```bash
# Foundry: https://book.getfoundry.sh/getting-started/installation
forge --version

# OpenZeppelin v5 + forge-std (already under lib/ if you have this tree)
forge install OpenZeppelin/openzeppelin-contracts@v5.2.0 --no-git
forge install foundry-rs/forge-std@v1.9.6 --no-git
```

## Commands

```bash
cd contracts   # this directory

forge build
forge test
forge test -vvv
forge fmt
```

## Robinhood Chain (chainId 4663)

| | Mainnet | Testnet |
| --- | --- | --- |
| Chain ID | **4663** | 46630 |
| RPC | `https://rpc.mainnet.chain.robinhood.com` | `https://rpc.testnet.chain.robinhood.com` |
| Explorer | `https://robinhoodchain.blockscout.com` | `https://explorer.testnet.chain.robinhood.com` |
| Gas token | ETH | ETH |

`foundry.toml` names these as `robinhood_mainnet` / `robinhood_testnet`. Override the RPC with `RH_RPC_URL` if you use a private endpoint. Robinhood Chain is an Arbitrum Orbit L2; if a broadcast sticks, retry with `--legacy`.

### Deploy

```bash
export PRIVATE_KEY=0x...
export RH_RPC_URL=https://rpc.mainnet.chain.robinhood.com

# Optional config (defaults shown)
# export MILK=0x...                 # existing $MILK; omit to deploy MockMILK
# export ROYALTY_RECEIVER=0x...     # ERC-2981 5% receiver (default: deployer)
# export OWNER=0x...                # Ownable owner (default: deployer)
# export MINT_PRICE=1000000000000000000
# export MINT_OPEN=0                # 0 = closed until owner calls setMintOpen
# export BASE_URI=ipfs://.../

forge script script/Deploy.s.sol:Deploy   --rpc-url $RH_RPC_URL   --private-key $PRIVATE_KEY   --broadcast   --chain-id 4663
```

Testnet: use chain id **46630** and `https://rpc.testnet.chain.robinhood.com`.

If `OWNER` is not the broadcaster, the owner must call `CashCows.setClockIn(feeSplitter)` after deploy.

### Verify (Blockscout)

```bash
forge verify-contract <address> src/CashCows.sol:CashCows   --chain-id 4663   --rpc-url $RH_RPC_URL   --verifier blockscout   --verifier-url https://robinhoodchain.blockscout.com/api/
```

## Owner config after deploy

- `setMintOpen(uint256 timestamp)` — `0` closes public mint
- `setMintPrice(uint256)` / `setMilk(address)`
- `setBaseURI(string)`
- `setRoyalty(address,uint96)` — default 500 / 10000 = 5%
- `setClockIn(address)`
