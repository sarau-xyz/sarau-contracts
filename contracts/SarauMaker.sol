// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./SarauNFT.sol";
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
     * @dev All Saraus addresses
     */
    mapping(uint256 => address) public saraus;

    /**
     * @dev SarauNFT address
     */
    address public immutable nftImplementation;

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
        nftImplementation = nftImplementation_;
        currency = currency_;
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
        address nftClone = Clones.clone(nftImplementation);
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

        index = currentIndex;
        saraus[index] = nftClone;
        emit SarauCreated(nftClone, index);

        currentIndex++;
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
        etherPrice = getPriceFromMsg(currency);
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
        emit ReceivedEther(msg.sender, msg.value);
    }
}
