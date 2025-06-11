import { HardhatUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";
import { config } from "dotenv";

// Load environment variables
config();

// Check that the required environment variables are set
if (
  !process.env.LOCAL_KEYS
  || !process.env.TESTNET_KEYS
  || !process.env.MAINNET_KEYS
) {
  throw new Error("some required keys are missing in the .env file");
}

const hardhatConfig: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    evmoslocal: {
      url: "http://127.0.0.1:8545",
      chainId: 9002,
      accounts: process.env.LOCAL_KEYS.split(","),
    },
    oslocal: {
      url: "http://127.0.0.1:8545",
      chainId: 9001,
      accounts: process.env.LOCAL_KEYS.split(","),
    },
    evmostestnet: {
      url: "https://evmos-testnet.lava.build",
      chainId: 9000,
      accounts: process.env.TESTNET_KEYS.split(","),
    },
    evmosmainnet: {
      url: "https://evmos.lava.build",
      chainId: 9001,
      accounts: process.env.MAINNET_KEYS.split(","),
    },
    sagaoslocal: {
      // NOTE: this would usually be 8545 but this is set up for hanchond which remaps the ports
      url: "http://127.0.0.1:53901",
      chainId: 1234,
      accounts: process.env.LOCAL_KEYS.split(",")
    },
    sagaosstaging: {
      url: "https://sagaevm-54647357-1.jsonrpc.staging-srv.sagarpc.io:443",
      chainId: 54647357,
      accounts: process.env.TESTNET_KEYS.split(",")
    }
  },
};

export default hardhatConfig;
