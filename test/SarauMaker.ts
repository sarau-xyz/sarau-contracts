import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SarauMaker", function () {
  async function deploySarauMakerFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SarauNFT = await ethers.getContractFactory("SarauNFT");
    const sarauNFT = await SarauNFT.deploy();

    const SarauMaker = await ethers.getContractFactory("SarauMaker");
    const sarauMaker = await SarauMaker.deploy(sarauNFT.address);

    return { sarauMaker, sarauNFT, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should have correct SarauNFT implementation", async function () {
      const { sarauNFT, sarauMaker } = await loadFixture(deploySarauMakerFixture);

      expect(await sarauMaker.tokenImplementation()).to.equal(sarauNFT.address);
    });

    // it("Should mint after correct initialization", async function () {
    //   const { sarauNFT, otherAccount } = await loadFixture(
    //     deploySarauNFTFixture
    //   );

    //   await sarauNFT.initialize(
    //     "NFT",
    //     "Non Fungible Token",
    //     "https://miro.medium.com/max/560/1*YrmTwdjEuo3vDwGhagxslQ.jpeg"
    //   );

    //   await sarauNFT.mint(otherAccount.address);

    //   expect(await sarauNFT.balanceOf(otherAccount.address)).to.be.eq(1);
    // });

    // it("Should fail with Ownable: caller is not the owner", async function () {
    //   const { sarauNFT, otherAccount } = await loadFixture(
    //     deploySarauNFTFixture
    //   );

    //   await expect(sarauNFT.mint(otherAccount.address)).to.be.revertedWith(
    //     "Ownable: caller is not the owner"
    //   );
    // });
  });
});
