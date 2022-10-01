import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import fs from "fs";

const mnemonic = fs.readFileSync(".secret").toString();

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    celoalfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      accounts: {
        mnemonic: mnemonic,
      },
    },
    celo: {
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      accounts: {
        mnemonic: mnemonic,
      },
    },
  },
  etherscan: {
    apiKey: "",
  },
};

export default config;
