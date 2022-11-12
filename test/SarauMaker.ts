import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { WrapperBuilder } from "redstone-evm-connector";

const ETHER_DECIMALS = 1e18,
  REDSTONE_DECIMALS = 1e8,
  REDSTONE_SIGNER = "0xFE71e9691B9524BC932C23d0EeD5c9CE41161884"; // mock signer

const CURRENCY = "CELO",
  ETHER_PRICE = BigNumber.from("2000"), // 8 decimals to the left because redstone prod return like this
  CREATION_USD_FEE = BigNumber.from((0.5 * ETHER_DECIMALS).toString()),
  EXPECTED_ETHER_FEE = BigNumber.from((0.00025 * ETHER_DECIMALS).toString()); // 0.2 USD

describe("SarauMaker", function () {
  async function deploySarauMakerFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SarauNFT = await ethers.getContractFactory("SarauNFT");
    const sarauNFT = await SarauNFT.deploy();

    const SarauMaker = await ethers.getContractFactory("SarauMaker");
    const sarauMaker = await SarauMaker.deploy(
      sarauNFT.address,
      ethers.utils.formatBytes32String(CURRENCY),
      REDSTONE_DECIMALS
    );

    // mock signer
    await sarauMaker.setRedstoneSigner(REDSTONE_SIGNER);

    return {
      sarauMaker: WrapperBuilder.mockLite(sarauMaker).using({
        [CURRENCY]: ETHER_PRICE.toNumber(),
      }),
      sarauNFT,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should have correct SarauNFT", async function () {
      const { sarauNFT, sarauMaker } = await loadFixture(
        deploySarauMakerFixture
      );

      expect(await sarauMaker.NFT_IMPLEMENTATION()).to.equal(sarauNFT.address);
    });

    it("Should have correct currency", async function () {
      const { sarauNFT, sarauMaker } = await loadFixture(
        deploySarauMakerFixture
      );

      expect(await sarauMaker.CURRENCY()).to.equal(
        ethers.utils.formatBytes32String(CURRENCY)
      );
    });

    it("Should have correct Redstone Signer and Decimals", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      expect(await sarauMaker.redstoneSigner()).to.equal(REDSTONE_SIGNER);
      expect(await sarauMaker.redstoneDecimals()).to.equal(REDSTONE_DECIMALS);
    });
  });

  describe("Sarau admin flow", function () {
    it("Should set Redstone Signer", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      await sarauMaker.setRedstoneSigner(ethers.constants.AddressZero);

      expect(await sarauMaker.redstoneSigner()).to.equal(
        ethers.constants.AddressZero
      );
    });

    it("Should set Redstone Decimals", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      const newDecimals = 2;

      await sarauMaker.setRedstoneDecimals(newDecimals);

      expect(await sarauMaker.redstoneDecimals()).to.equal(newDecimals);
    });

    it("Should update ether price", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      expect(await sarauMaker.etherPrice()).to.equal(BigNumber.from("0"));

      await sarauMaker.updateEtherPrice();

      expect(await sarauMaker.etherPrice()).to.equal(
        ETHER_PRICE.mul(BigNumber.from(REDSTONE_DECIMALS.toString()))
      );
    });

    it("Should set creationUSDFee", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      expect(await sarauMaker.creationUSDFee()).to.equal(BigNumber.from("0"));

      await sarauMaker.setCreationUSDFee(CREATION_USD_FEE.toString());

      expect(await sarauMaker.creationUSDFee()).to.equal(
        CREATION_USD_FEE.toString()
      );
    });

    it("Should has correct creationEtherFee", async function () {
      const { sarauMaker } = await loadFixture(deploySarauMakerFixture);

      await sarauMaker.updateEtherPrice();

      expect(await sarauMaker.etherPrice()).to.equal(
        ETHER_PRICE.mul(BigNumber.from(REDSTONE_DECIMALS.toString()))
      );

      await sarauMaker.setCreationUSDFee(CREATION_USD_FEE.toString());

      expect(await sarauMaker.creationUSDFee()).to.equal(
        CREATION_USD_FEE.toString()
      );

      expect(await sarauMaker.creationEtherFee()).to.equal(EXPECTED_ETHER_FEE);
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

      await expect(
        sarauMaker.mint(1, ethers.utils.formatBytes32String(""))
      ).to.revertedWith("outside mint window");
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

      await sarauMaker.mint(1, ethers.utils.formatBytes32String(""));

      await expect(
        sarauMaker.mint(1, ethers.utils.formatBytes32String(""))
      ).to.revertedWith("already minted");
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

      sarauMaker.mint(1, ethers.utils.formatBytes32String(""));

      await expect(
        sarauMaker
          .connect(otherAccount)
          .mint(1, ethers.utils.formatBytes32String(""))
      ).to.revertedWith("max mint reached");
    });

    it("Should create a new Sarau and mint without redstone fee", async function () {
      const { sarauMaker, sarauNFT } = await loadFixture(
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

      await sarauMaker.mint(1, ethers.utils.formatBytes32String(""));

      await expect(
        sarauMaker.mint(1, ethers.utils.formatBytes32String(""))
      ).to.revertedWith("max mint reached");

      const sarauCreated = await sarauMaker.getSarauAddress(1);

      const nftInstance = sarauNFT.attach(sarauCreated);

      expect(await nftInstance.totalSupply()).to.equal(1);
    });
  });
});
