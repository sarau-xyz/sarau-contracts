// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./SarauNFT.sol";
import "./SarauMinter.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "redstone-evm-connector/lib/contracts/message-based/PriceAware.sol";

contract SarauMaker is AccessControl, PriceAware {
    /**
     * @dev Current index
     */
    uint256 public currentIndex;
    /**
     * @dev USD fee needed to create a new Sarau
     */
    uint256 public creationUSDFee;

    /**
     * @dev All Sarau minter addresses
     */
    mapping(uint256 => address) public saraus;

    /**
     * @dev SarauNFT address
     */
    address public immutable nftImplementation;
    /**
     * @dev SarauMinter address
     */
    address public immutable minterImplementation;

    /**
     * @dev Blockchain native currency symbol, will be used in RedStone oracle
     */
    bytes32 public immutable currency;

    /**
     * @dev Ether price from RedStone oracle
     */
    uint256 public etherPrice;

    /**
     * @dev RedStone signer address
     */
    address public redstoneSigner;

    /**
     * @dev Events
     */
    event ReceivedEther(address indexed sender, uint256 indexed amount);
    event EtherFlushed(address indexed sender, uint256 amount);
    event SarauCreated(address indexed owner, uint256 indexed id);

    constructor(
        address nftImplementation_,
        address minterImplementation_,
        bytes32 currency_
    ) {
        nftImplementation = nftImplementation_;
        minterImplementation = minterImplementation_;
        currency = currency_;
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Creates a new Sarau.
     */

    // TODO change this to two steps
    function createSarau(
        uint256 maxMint_,
        uint256 startDate_,
        uint256 endDate_,
        string calldata uri_,
        string calldata homepage_,
        string calldata name,
        string calldata symbol,
        bytes32 code_
    ) external payable returns (uint256) {
        require(msg.value == creationEtherFee(), "incorrect fee");
        require(startDate_ > 0, "startDate_ must be greater than zero");
        require(endDate_ > 0, "endDate_ must be greater than zero");
        require(
            endDate_ > startDate_,
            "endDate_ must be greater than startDate_"
        );
        
        // clone SarauNFT
        address nftClone = Clones.clone(nftImplementation);
        SarauNFT(nftClone).initialize(name, symbol, uri_);

        // clone SarauMinter
        address minterClone = Clones.clone(minterImplementation);
        SarauMinter(minterClone).initialize(
            maxMint_,
            startDate_,
            endDate_,
            homepage_,
            code_,
            nftClone
        );

        uint256 createdIndex = currentIndex;

        currentIndex++;

        emit SarauCreated(nftClone, currentIndex);

        return createdIndex;
    }

    /**
     * @dev Return a single Sarau by provided index.
     */
    function getSarau(uint256 index_) external view returns (address) {
        return saraus[index_];
    }

    /**
     * @dev Set Redstone Finance signer address.
     */
    function setRedstoneSigner(address redstoneSigner_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        redstoneSigner = redstoneSigner_;
    }

    /**
     * @dev Set creation fee.
     */
    function setCreationUSDFee(uint256 creationFee_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        creationUSDFee = creationFee_;
    }

    /**
     * @dev Update native currency price.
     */
    function updateEtherPrice() external {
        etherPrice = getPriceFromMsg(currency);
    }

    /**
     * @dev Return creation fee in Ether.
     */
    function creationEtherFee() public view returns (uint256) {
        return etherPrice * creationUSDFee;
    }

    /**
     * @notice Allows owner to withdraw funds generated from sale.
     *
     * @param _to. The address to send the funds to.
     */
    function flushETH(address _to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_to != address(0), "CANNOT WITHDRAW TO ZERO ADDRESS");

        uint256 contractBalance = address(this).balance;

        require(contractBalance > 0, "NO ETHER TO WITHDRAW");

        payable(_to).transfer(contractBalance);

        emit EtherFlushed(_msgSender(), contractBalance);
    }

    /**
     * @dev Fallback function for receiving Ether
     */
    receive() external payable {
        emit ReceivedEther(msg.sender, msg.value);
    }

    function isSignerAuthorized(address _receivedSigner)
        public
        view
        virtual
        override
        returns (bool)
    {
        return _receivedSigner == redstoneSigner;
    }
}
