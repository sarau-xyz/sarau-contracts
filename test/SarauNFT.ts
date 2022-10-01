import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SarauNFT", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySarauNFTFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SarauNFT = await ethers.getContractFactory("SarauNFT");
    const sarauNFT = await SarauNFT.deploy();

    return { sarauNFT, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should have empty URI", async function () {
      const { sarauNFT } = await loadFixture(deploySarauNFTFixture);

      expect(await sarauNFT.tokenURI(1)).to.equal("");
    });

    it("Should mint after correct initialization", async function () {
      const { sarauNFT, otherAccount } = await loadFixture(
        deploySarauNFTFixture
      );

      await sarauNFT.initialize(
        "NFT",
        "Non Fungible Token",
        "https://miro.medium.com/max/560/1*YrmTwdjEuo3vDwGhagxslQ.jpeg"
      );

      await sarauNFT.mint(otherAccount.address);

      expect(await sarauNFT.balanceOf(otherAccount.address)).to.be.eq(1);
    });

    it("Should fail with Ownable: caller is not the owner", async function () {
      const { sarauNFT, otherAccount } = await loadFixture(
        deploySarauNFTFixture
      );

      await expect(sarauNFT.mint(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
