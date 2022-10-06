import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import fs from "fs";

const mnemonic = fs.readFileSync(".secret").toString();
const apikey = fs.readFileSync(".apikey").toString();

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      accounts: {
        mnemonic,
      },
    },
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: {
        mnemonic,
      },
    },
  },
  etherscan: {
    apiKey: apikey,
    customChains: [
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
    ],
  },
};

export default config;
