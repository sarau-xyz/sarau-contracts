import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { WrapperBuilder } from "redstone-evm-connector";

const CURRENCY = "CELO",
  ETHER_PRICE = 10,
  CREATION_FEE = 9;

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

    // mock signer
    await sarauMaker.setRedstoneSigner(
      "0xFE71e9691B9524BC932C23d0EeD5c9CE41161884"
    );

    return {
      sarauMaker: WrapperBuilder.mockLite(sarauMaker).using({
        [CURRENCY]: ETHER_PRICE,
      }),
      sarauNFT,
      owner,
      otherAccount,
    };
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
      expect(await sarauMaker.creationUSDFee()).to.equal(0);
    });
  });

  describe("Sarau creation flow", function () {
    it("Should revert with startDate_ must be a positive number", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      const maxMint = 1,
        startDate = 0,
        endDate = 0,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol
        )
      ).to.revertedWith("startDate_ must be a positive number");
    });

    it("Should revert with endDate_ must be greater than zero", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      const maxMint = 1,
        startDate = 1,
        endDate = 0,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      await expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol
        )
      ).to.revertedWith("endDate_ must be greater than zero");
    });

    it("Should revert with endDate_ must be greater than startDate_", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      const maxMint = 1,
        startDate = 11,
        endDate = 10,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      await expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol
        )
      ).to.revertedWith("endDate_ must be greater than startDate_");
    });

    it("Should update ether price", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      expect(await sarauMaker.etherPrice()).to.equal(BigNumber.from("0"));

      await sarauMaker.updateEtherPrice();

      expect(await sarauMaker.etherPrice()).to.equal(
        BigNumber.from(ETHER_PRICE).mul(1e8)
      );

      expect(await sarauMaker.creationEtherFee()).to.equal(
        BigNumber.from(ETHER_PRICE).mul(BigNumber.from("0"))
      );

      await sarauMaker.setCreationUSDFee(CREATION_FEE);

      expect(await sarauMaker.creationEtherFee()).to.equal(
        BigNumber.from(ETHER_PRICE).mul(BigNumber.from(CREATION_FEE)).mul(1e8)
      );
    });

    it("Should create with correct fee", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      expect(await sarauMaker.etherPrice()).to.equal(BigNumber.from("0"));

      await sarauMaker.updateEtherPrice();

      const etherFee = await sarauMaker.creationEtherFee();

      const maxMint = 1,
        startDate = 10,
        endDate = 11,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      await expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol,
          {
            value: etherFee,
          }
        )
      ).to.emit(sarauMaker, "SarauCreated");
    });

    it("Should revert with incorrect fee", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      const maxMint = 1,
        startDate = 10,
        endDate = 11,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      await expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol,
          {
            value: 10,
          }
        )
      ).to.revertedWith("incorrect fee");
    });

    it("Should revert with outside mint window", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      const timeNow = await time.latest();

      const maxMint = 1,
        startDate = timeNow,
        endDate = timeNow + 1000,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      await expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol
        )
      ).to.emit(sarauMaker, "SarauCreated");

      await time.increaseTo(endDate + 1000);

      await expect(sarauMaker.mint(0)).to.revertedWith("outside mint window");
    });

    it("Should revert with already minted", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      const timeNow = await time.latest();

      const maxMint = 2,
        startDate = timeNow,
        endDate = timeNow + 1000,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      await expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol
        )
      ).to.emit(sarauMaker, "SarauCreated");

      await sarauMaker.mint(0);

      await expect(sarauMaker.mint(0)).to.revertedWith("already minted");
    });

    it("Should revert with max mint reached", async function () {
      const { sarauMaker, otherAccount } = await loadFixture(
        deploySarauMakerFixture
      );

      const timeNow = await time.latest();

      const maxMint = 1,
        startDate = timeNow,
        endDate = timeNow + 1000,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      await expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol
        )
      ).to.emit(sarauMaker, "SarauCreated");

      sarauMaker.mint(0);

      await expect(sarauMaker.connect(otherAccount).mint(0)).to.revertedWith(
        "max mint reached"
      );
    });

    it("Should create a new Sarau and mint without redstone fee", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      const timeNow = await time.latest();

      const maxMint = 1,
        startDate = timeNow,
        endDate = timeNow + 1000,
        uri = "",
        homepage = "",
        name = "",
        symbol = "";

      await expect(
        sarauMaker.createSarau(
          maxMint,
          startDate,
          endDate,
          uri,
          homepage,
          name,
          symbol
        )
      ).to.emit(sarauMaker, "SarauCreated");

      await sarauMaker.mint(0);

      await expect(sarauMaker.mint(0)).to.revertedWith("max mint reached");

      const sarauCreated = await sarauMaker.getSarau(0);

      expect(sarauCreated.minted).to.equal(1);
    });
  });
});
