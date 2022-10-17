// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./SarauNFT.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "redstone-evm-connector/lib/contracts/message-based/PriceAware.sol";

contract SarauMaker is AccessControl, PriceAware {
    struct SarauInfo {
        address owner;
        uint256 maxMint;
        uint256 minted;
        uint256 startDate;
        uint256 endDate;
        string homepage;
        address nft;
    }

    uint256 public currentIndex;
    uint256 public creationUSDFee;

    mapping(uint256 => SarauInfo) public saraus;
    mapping(uint256 => mapping(address => bool)) public addressToMints;

    address public immutable tokenImplementation;

    /**
     * Blockchain native currency symbol, will be used in RedStone oracle
     */
    bytes32 public immutable currency;

    /**
     * Ether price from RedStone oracle
     */
    uint256 public etherPrice;

    /**
     * RedStone signer address
     */
    address public redstoneSigner;

    /**
     * @dev Events
     */
    event ReceivedEther(address indexed sender, uint256 indexed amount);
    event EtherFlushed(address indexed sender, uint256 amount);
    event SarauCreated(address indexed owner, uint256 indexed id);

    constructor(address tokenImplementation_, bytes32 currency_) {
        tokenImplementation = tokenImplementation_;
        currency = currency_;
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Creates a new Sarau.
     */
    function createSarau(
        uint256 maxMint_,
        uint256 startDate_,
        uint256 endDate_,
        string calldata uri_,
        string calldata homepage_,
        string calldata name,
        string calldata symbol
    ) external payable returns (uint256) {
        require(startDate_ > 0, "startDate_ must be greater than zero");
        require(endDate_ > 0, "endDate_ must be greater than zero");
        require(
            endDate_ > startDate_,
            "endDate_ must be greater than startDate_"
        );

        require(msg.value == creationEtherFee(), "incorrect fee");

        address clone = Clones.clone(tokenImplementation);
        SarauNFT(clone).initialize(name, symbol, uri_);

        uint256 sarauIndex = currentIndex;

        saraus[sarauIndex] = SarauInfo(
            _msgSender(),
            maxMint_,
            0,
            startDate_,
            endDate_,
            homepage_,
            clone
        );

        currentIndex++;

        emit SarauCreated(clone, currentIndex);

        return sarauIndex;
    }

    /**
     * @dev Return a single Sarau by provided index.
     */
    function getSarau(uint256 index_) external view returns (SarauInfo memory) {
        return saraus[index_];
    }

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
     * @dev Mint one Sarau NFT.
     */
    function mint(uint256 index_) external {
        require(
            saraus[index_].maxMint > saraus[index_].minted,
            "max mint reached"
        );
        require(
            block.timestamp >= saraus[index_].startDate &&
                block.timestamp <= saraus[index_].endDate,
            "outside mint window"
        );
        require(!addressToMints[index_][_msgSender()], "already minted");

        // update state
        addressToMints[index_][_msgSender()] = true;
        saraus[index_].minted++;

        SarauNFT(saraus[index_].nft).mint(_msgSender());
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
