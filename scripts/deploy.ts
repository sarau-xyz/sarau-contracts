import { ethers, run } from "hardhat";

const REDSTONE_MAIN_SIGNER = "0x0C39486f770B26F5527BBBf942726537986Cd7eb",
  REDSTONE_DECIMALS = (1e8).toString(),
  CREATION_USD_FEE = (0.2 * 1e18).toString(),
  BYTES_32_CURRENCY = ethers.utils.formatBytes32String("CELO");

async function main() {
  const SarauNFT = await ethers.getContractFactory("SarauNFT");
  const _sarauNFTInstance = await SarauNFT.deploy();

  await _sarauNFTInstance.deployed();

  const SarauMaker = await ethers.getContractFactory("SarauMaker");
  const _sarauMakerInstance = await SarauMaker.deploy(
    _sarauNFTInstance.address,
    BYTES_32_CURRENCY,
    REDSTONE_DECIMALS
  );

  await _sarauMakerInstance.deployed();

  await _sarauMakerInstance.setRedstoneSigner(REDSTONE_MAIN_SIGNER);
  await _sarauMakerInstance.setCreationUSDFee(CREATION_USD_FEE);

  console.log(`SarauMaker deployed to ${_sarauMakerInstance.address}`);

  // verify SarauMaker
  await run("verify:verify", {
    address: _sarauMakerInstance.address,
    constructorArguments: [
      _sarauNFTInstance.address,
      BYTES_32_CURRENCY,
      REDSTONE_DECIMALS,
    ],
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
