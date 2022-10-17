// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./SarauNFT.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SarauMinter is Initializable, OwnableUpgradeable {
    uint256 public maxMint;
    uint256 public minted;
    uint256 public startDate;
    uint256 public endDate;
    string public homepage;
    bytes32 private code;
    address public nft;

    mapping(address => uint8) public addressToMints;

    function initialize(
        uint256 maxMint_,
        uint256 startDate_,
        uint256 endDate_,
        string calldata homepage_,
        bytes32 code_,
        address nft_
    ) public initializer {
        maxMint = maxMint_;
        startDate = startDate_;
        endDate = endDate_;
        homepage = homepage_;
        code = code_;
        nft = nft_;

        __Ownable_init();
    }

    /**
     * @dev Mint one Sarau NFT.
     */
    function mint(bytes32 code_) external returns(uint256) {
        require(maxMint > minted, "max mint reached");
        require(
            block.timestamp >= startDate && block.timestamp <= endDate,
            "outside mint window"
        );
        require(addressToMints[_msgSender()] != 1, "already minted");
        require(code == code_, "invalid mint code");

        // update state
        addressToMints[_msgSender()] = 1;
        minted++;

        SarauNFT(nft).mint(_msgSender());

        return minted;
    }
}
