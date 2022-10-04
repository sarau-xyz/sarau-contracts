import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const CURRENCY = "CELO";

describe("SarauMaker", function () {
  async function deploySarauMakerFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SarauNFT = await ethers.getContractFactory("SarauNFT");
    const sarauNFT = await SarauNFT.deploy();

    const SarauMaker = await ethers.getContractFactory("SarauMaker");
    const sarauMaker = await SarauMaker.deploy(
      sarauNFT.address,
      ethers.utils.formatBytes32String(CURRENCY)
    );

    return { sarauMaker, sarauNFT, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should have correct SarauNFT implementation and currency", async function () {
      const { sarauNFT, sarauMaker } = await loadFixture(
        deploySarauMakerFixture
      );

      expect(await sarauMaker.tokenImplementation()).to.equal(sarauNFT.address);
      expect(await sarauMaker.currency()).to.equal(
        ethers.utils.formatBytes32String(CURRENCY)
      );
    });
  });

  describe("Sarau flow", function () {
    it("Should create a new Sarau", async function () {
      const { sarauNFT, sarauMaker } = await loadFixture(
        deploySarauMakerFixture
      );

      await sarauMaker.createSarau();
    });
  });
});
