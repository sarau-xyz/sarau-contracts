import { ethers } from "hardhat";

async function main() {
  const SarauNFT = await ethers.getContractFactory("SarauNFT");
  const _sarauNFTInstance = await SarauNFT.deploy();

  await _sarauNFTInstance.deployed();

  const SarauMaker = await ethers.getContractFactory("SarauMaker");
  const _sarauMakerInstance = await SarauMaker.deploy(
    _sarauNFTInstance.address,
    ethers.utils.formatBytes32String('CELO'),
  );

  await _sarauMakerInstance.deployed();

  console.log(`SarauMaker deployed to ${_sarauMakerInstance.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
