// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SarauNFT is ERC721AUpgradeable, Initializable, OwnableUpgradeable {
    string public _tokenURI;

    function initialize(
        string calldata name_,
        string calldata symbol_,
        string calldata tokenURI_
    ) public initializerERC721A initializer {
        __ERC721A_init(name_, symbol_);
        __Ownable_init();
        _tokenURI = tokenURI_;
    }

    /**
     * @dev Return NFT URI.
     */
    function tokenURI() external view returns (string memory) {
        return _tokenURI;
    }

    /**
     * @dev Mint one Sarau NFT.
     */
    function mint(address minter_) external payable onlyOwner {
        _mint(minter_, 1);
    }
}
