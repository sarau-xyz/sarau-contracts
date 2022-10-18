import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SarauNFT", function () {
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

      const timeNow = await time.latest();

      await sarauNFT.initialize(
        2,
        timeNow - 1,
        timeNow + 1000,
        "https://nft.link",
        "Non Fungible Token",
        "NFT",
        "https://miro.medium.com/max/560/1*YrmTwdjEuo3vDwGhagxslQ.jpeg"
      );

      await sarauNFT
        .connect(otherAccount)
        .mint(ethers.utils.formatBytes32String(""));

      expect(await sarauNFT.balanceOf(otherAccount.address)).to.be.eq(1);
    });

    it("Should fail with Ownable: caller is not the owner", async function () {
      const { sarauNFT, otherAccount } = await loadFixture(
        deploySarauNFTFixture
      );

      await expect(
        sarauNFT
          .connect(otherAccount)
          .setCode(ethers.utils.formatBytes32String(""))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
