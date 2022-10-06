import { ethers, run } from "hardhat";

async function main() {
  const bytes32Currency = ethers.utils.formatBytes32String("CELO");

  const SarauNFT = await ethers.getContractFactory("SarauNFT");
  const _sarauNFTInstance = await SarauNFT.deploy();

  await _sarauNFTInstance.deployed();

  const SarauMaker = await ethers.getContractFactory("SarauMaker");
  const _sarauMakerInstance = await SarauMaker.deploy(
    _sarauNFTInstance.address,
    bytes32Currency
  );

  await _sarauMakerInstance.deployed();

  console.log(`SarauMaker deployed to ${_sarauMakerInstance.address}`);

  // verify SarauMaker
  await run("verify:verify", {
    address: _sarauMakerInstance.address,
    constructorArguments: [_sarauNFTInstance.address, bytes32Currency],
  });

  // verify SarauNFT
  await run("verify:verify", {
    address: _sarauNFTInstance.address,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
