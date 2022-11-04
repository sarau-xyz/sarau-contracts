import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config';

const mnemonic = process.env.MNEMONIC;
const apikey = process.env.API_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    alfajores: {
      url: "https://celo-hackathon.lavanet.xyz/celo-alfajores/http",
      chainId: 44787,
      accounts: {
        mnemonic,
      },
    },
    celo: {
      url: "https://celo-hackathon.lavanet.xyz/celo/http",
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
