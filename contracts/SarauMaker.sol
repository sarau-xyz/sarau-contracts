// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./SarauNFT.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "redstone-evm-connector/lib/contracts/message-based/PriceAware.sol";

contract SarauMaker is AccessControl, PriceAware {
    using Counters for Counters.Counter;

    /**
     * @dev Current index
     */
    Counters.Counter private sarauIndexes;
    
    /**
     * @dev USD fee needed to create a new Sarau
     */
    uint256 public creationUSDFee;

    /**
     * @dev All Saraus addresses
     */
    mapping(uint256 => address) public saraus;

    /**
     * @dev Saraus created by users
     */
    // TODO add enumerable set instead uint256
    private mapping(address => uint256[]) public addressesForSaraus;

    /**
     * @dev SarauNFT address
     */
    address public immutable NFT_IMPLEMENTATION;

    /**
     * @dev Blockchain native currency symbol, will be used in RedStone oracle
     */
    bytes32 public immutable CURRENCY;

    /**
     * @dev Ether price from RedStone oracle
     */
    uint256 public etherPrice;

    /**
     * @dev RedStone signer address
     */
    address public redstoneSigner;

    /**
     * @dev RedStone price decimals
     */
    uint256 public redstoneDecimals;

    /**
     * @dev Events
     */
    event ReceivedEther(address indexed sender, uint256 indexed amount);
    event EtherFlushed(address indexed sender, uint256 amount);
    event RedstoneSignerChanged(address signer);
    event RedstoneDecimalsChanged(uint256 decimals);
    event CreationUSDFeeChanged(uint256 indexed fee);
    event SarauCreated(address indexed nft, uint256 indexed id);

    constructor(
        address nftImplementation_,
        bytes32 currency_,
        uint256 redstoneDecimals_
    ) {
        NFT_IMPLEMENTATION = nftImplementation_;
        CURRENCY = currency_;
        redstoneDecimals = redstoneDecimals_;
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Creates a new Sarau.
     */
    function createSarau(
        uint256 maxMint_,
        uint256 startDate_,
        uint256 endDate_,
        string calldata homepage_,
        string calldata name,
        string calldata symbol,
        string calldata uri_
    ) external payable returns (uint256 index) {
        require(msg.value == creationEtherFee(), "incorrect fee");
        require(startDate_ > 0, "startDate_ must be greater than zero");
        require(endDate_ > 0, "endDate_ must be greater than zero");
        require(
            endDate_ > startDate_,
            "endDate_ must be greater than startDate_"
        );

        // clone SarauNFT
        address nftClone = Clones.clone(NFT_IMPLEMENTATION);
        SarauNFT(nftClone).initialize(
            maxMint_,
            startDate_,
            endDate_,
            homepage_,
            name,
            symbol,
            uri_
        );

        SarauNFT(nftClone).transferOwnership(_msgSender());

        index = sarauIndexes.current();
        saraus[index] = nftClone;
        addressesForSaraus[_msgSender()].push(index);
        emit SarauCreated(nftClone, index);

        sarauIndexes.increment();
    }

    /**
     * @dev Return a single Sarau by provided index.
     */
    function getSarau(uint256 index_) public view returns (address) {
        return saraus[index_];
    }

    function mint(uint256 index_, bytes32 code_) external returns (uint256) {
        return SarauNFT(getSarau(index_)).mint(code_);
    }

// TODO use with enumerableset
    function getSarausByUser

    /**
     * @dev Set Redstone Finance signer address.
     */
    function setRedstoneSigner(address redstoneSigner_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        redstoneSigner = redstoneSigner_;
        emit RedstoneSignerChanged(redstoneSigner_);
    }

    /**
     * @dev Set Redstone Finance signer address.
     */
    function setRedstoneDecimals(uint256 redstoneDecimals_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        redstoneDecimals = redstoneDecimals_;
        emit RedstoneDecimalsChanged(redstoneDecimals_);
    }

    function isSignerAuthorized(address _receivedSigner)
        public
        view
        virtual
        override
        returns (bool)
    {
        return redstoneSigner == _receivedSigner;
    }

    /**
     * @dev Set creationUSDFee.
     *
     * Must be provided with decimal point moved 18 places to the right
     *
     * eg.: 0.2 must be provided as 20000000
     */
    function setCreationUSDFee(uint256 creationUSDFee_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        creationUSDFee = creationUSDFee_;
        emit CreationUSDFeeChanged(creationUSDFee_);
    }

    /**
     * @dev Update native currency price.
     */
    function updateEtherPrice() external {
        /**
         * this price is returned moved by 8 decimal point to the right
         *
         * eg.: 2_000 will be 200_000_000_000
         */
        etherPrice = getPriceFromMsg(CURRENCY);
    }

    /**
     * @dev Return creation fee in Ether with decimal places moved 18
     * places to the right.
     */
    function creationEtherFee() public view returns (uint256) {
        return
            (etherPrice == 0 ? 0 : creationUSDFee / etherPrice) *
            redstoneDecimals;
    }

    /**
     * @notice Allows owner to withdraw funds generated from sale.
     *
     * @param _to. The address to send the funds to.
     */
    function flushETH(address _to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_to != address(0), "cannot withdraw to zero address");

        uint256 contractBalance = address(this).balance;

        require(contractBalance > 0, "no ether to withdraw");

        payable(_to).transfer(contractBalance);

        emit EtherFlushed(_msgSender(), contractBalance);
    }

    /**
     * @dev Fallback function for receiving Ether
     */
    receive() external payable {
        emit ReceivedEther(_msgSender(), msg.value);
    }
}
