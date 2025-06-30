# Evmos Contracts Testing

This a basic Hardhat project that contains scripts to test contracts
and EVM extensions in the Evmos chain or other (Cosmos EVM-based) blockchains.

## How To Use

To stake some tokens, follow these steps:

- create a `.env` file with your private key/s (refer to `.env.example` and adjust keys)
- send some funds to your account
- run a node locally. E.g. you could use the `local_node.sh` on evmos repo.
- run scripts or tests using the hardhat CLI commands, e.g.: `npx hardhat test test/token/testToken.ts --network evmoslocal --bail`
- you can run the scripts against testnet or mainnet too. Just use the `--network` flag and specify `evmostestnet` or `evmosmainnet` accordingly

### Adding Other Networks

In order to add other networks for testing, just adjust the `hardhat.config.ts`
and add a corresponding entry to the `networks` field.

