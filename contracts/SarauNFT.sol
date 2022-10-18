// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SarauNFT is ERC721AUpgradeable, Initializable, OwnableUpgradeable {
    uint256 public maxMint;
    uint256 public minted;
    uint256 public startDate;
    uint256 public endDate;
    string public homepage;
    bytes32 private code;

    /**
     * @dev Save address that already minted.
     */
    mapping(address => uint8) public addressToMints;

    string private _tokenURI;

    function initialize(
        uint256 maxMint_,
        uint256 startDate_,
        uint256 endDate_,
        string calldata homepage_,
        string calldata name_,
        string calldata symbol_,
        string calldata tokenURI_
    ) external initializerERC721A initializer {
        maxMint = maxMint_;
        startDate = startDate_;
        endDate = endDate_;
        homepage = homepage_;

        _tokenURI = tokenURI_;

        __ERC721A_init(name_, symbol_);
        __Ownable_init();
    }

    /**
     * @dev Return NFT URI.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return _tokenURI;
    }

    /**
     * @dev Change mint code.
     */
    function setCode(bytes32 code_) external onlyOwner {
        code = code_;
    }

    /**
     * @dev Verify if user already minted;
     */
    function canMint(address wallet) public view returns (bool) {
        return addressToMints[wallet] != 1;
    }

    /**
     * @dev Mint one Sarau NFT.
     */
    function mint(bytes32 code_) external payable returns (uint256) {
        require(maxMint > minted, "max mint reached");
        require(
            block.timestamp >= startDate && block.timestamp <= endDate,
            "outside mint window"
        );
        require(canMint(_msgSender()), "already minted");
        require(code == code_, "invalid mint code");

        // update state
        addressToMints[_msgSender()] = 1;
        minted++;

        _mint(_msgSender(), 1);

        return minted;
    }
}
