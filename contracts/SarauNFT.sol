// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract SarauNFT is
    ERC721AUpgradeable,
    Initializable,
    AccessControlUpgradeable
{
    uint256 public maxMint;
    uint256 public startDate;
    uint256 public endDate;
    string public homepage;
    bytes32 private code;

    string private _tokenURI;

    /**
     * @dev ROLES
     */
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

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
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(MINTER_ROLE, _msgSender());
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
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlUpgradeable, ERC721AUpgradeable)
        returns (bool)
    {
        return
            interfaceId == type(AccessControlUpgradeable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Change mint code.
     */
    function setCode(bytes32 code_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        code = code_;
    }

    /**
     * @dev MINTING
     */

    /**
     * @notice Function to mint NFTs to a specified address. Only
     * accessible by accounts with a role of MINTER_ROLE
     *
     * @param amount The amount of NFTs to be minted
     * @param _to The address to which the NFTs will be minted to
     */
    function mintTo(
        uint256 amount,
        address _to,
        bytes32 code_
    ) external onlyRole(MINTER_ROLE) {
        require(code == code_, "invalid mint code");

        _safeMint(_to, amount);
    }
}
