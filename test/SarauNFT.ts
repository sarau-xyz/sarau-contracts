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

      await sarauNFT.mintTo(
        1,
        otherAccount.address,
        ethers.utils.formatBytes32String("")
      );

      expect(await sarauNFT.balanceOf(otherAccount.address)).to.be.eq(1);
    });

    it("Should fail with 'AccessControl: account 0xxxxx is missing role 0xxxxx'", async function () {
      const { sarauNFT, otherAccount } = await loadFixture(
        deploySarauNFTFixture
      );

      await expect(
        sarauNFT
          .connect(otherAccount)
          .setCode(ethers.utils.formatBytes32String(""))
      ).to.be.reverted;
    });

    it("Should fail with invalid mint code", async function () {
      const { sarauNFT, otherAccount } = await loadFixture(
        deploySarauNFTFixture
      );

      const code = "123";

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

      await sarauNFT.setCode(ethers.utils.formatBytes32String(code));

      await expect(
        sarauNFT.mintTo(
          1,
          otherAccount.address,
          ethers.utils.formatBytes32String("")
        )
      ).to.be.revertedWith("invalid mint code");

      await expect(
        sarauNFT.mintTo(
          1,
          otherAccount.address,
          ethers.utils.formatBytes32String(code)
        )
      ).to.emit(sarauNFT, "Transfer");
    });
  });
});
