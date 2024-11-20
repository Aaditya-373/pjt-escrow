// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DemandBasedToken is ERC20, AccessControl {
    address public owner;
    uint256 public tokenPrice;
    uint256 public initialPrice;
    uint256 public totalDeposited;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    event TokensMinted(address indexed buyer, uint256 amount, uint256 price);
    event PriceUpdated(uint256 newPrice);

    constructor(uint256 _initialPrice) ERC20("DemandBasedToken", "DBT") {
        owner = msg.sender;
        initialPrice = _initialPrice;
        tokenPrice = initialPrice;

        // Setting up roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); // Set deployer as admin
        _grantRole(MINTER_ROLE, msg.sender); // Set deployer as minter
    }

    function mintTokens(address buyer, uint256 tokensToMint) external onlyRole(MINTER_ROLE) {
        totalDeposited += tokensToMint;
        _mint(buyer, tokensToMint);
        updatePriceOnMint();
        emit TokensMinted(buyer, tokensToMint, tokenPrice);
    }

    function updatePriceOnMint() internal {
        uint256 increase = totalDeposited / 10 ether;
        tokenPrice = initialPrice + increase;
        emit PriceUpdated(tokenPrice);
    }

    function updatePriceOnWithdraw(uint256 withdrawalAmount) external onlyRole(MINTER_ROLE) {
        require(withdrawalAmount <= totalDeposited, "Withdrawal exceeds total deposited");

        totalDeposited -= withdrawalAmount;

        // Calculate the decrease based on the withdrawal amount
        // Use a smaller factor to ensure noticeable changes
        uint256 decrease = (withdrawalAmount * tokenPrice) / totalDeposited;

        // Safeguard to prevent price dropping below the initial price
        if (tokenPrice <= decrease + initialPrice) {
            tokenPrice = initialPrice;
        } else {
            tokenPrice -= decrease;
        }

        emit PriceUpdated(tokenPrice);
    }



    function getTokenPrice() external view returns (uint256) {
        return tokenPrice;
    }
}
