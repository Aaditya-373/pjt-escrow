// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./EscrowWallet.sol";

contract TokenPriceManager {
    IERC20 public token;             // The token contract
    EscrowWallet public escrow;      // The escrow wallet
    address public beneficiary;      // Address that receives milestone payments
    uint256 public tokenPrice;       // Current token price in wei (ETH)
    uint256 public initialTokenPrice;// Initial token price
    uint256 public totalDeposited;   // Total ETH deposited to the escrow

    event PriceUpdated(uint256 newPrice);
    event MilestonePayment(address indexed beneficiary, uint256 amount);

    constructor(address _token, address _escrow, address _beneficiary, uint256 _initialPrice) {
        token = IERC20(_token);
        escrow = EscrowWallet(_escrow);
        beneficiary = _beneficiary;
        tokenPrice = _initialPrice;
        initialTokenPrice = _initialPrice;
    }

    // Call this function after each deposit to update token price and send milestone if applicable
    function updatePriceOnDeposit(uint256 amountDeposited) external {
        totalDeposited += amountDeposited;
        
        // Increase the token price based on deposited amount and total supply
        uint256 supply = token.totalSupply();
        tokenPrice = initialTokenPrice + (totalDeposited * 1e18 / supply) / 10; // Arbitrary function for price growth

        emit PriceUpdated(tokenPrice);
        
        // Check if price milestone reached (10% increments from initial price)
        uint256 milestone = (initialTokenPrice * 11) / 10; // 10% increase from the last milestone
        if (tokenPrice >= milestone) {
            // Send 10% of the deposited amount to the beneficiary
            uint256 payout = amountDeposited / 10;
            payable(beneficiary).transfer(payout);
            emit MilestonePayment(beneficiary, payout);

            // Increase milestone for next check
            initialTokenPrice = milestone;
        }
    }

    // Call this function after each withdrawal to decrease token price
    function updatePriceOnWithdrawal(uint256 amountWithdrawn) external {
        require(totalDeposited >= amountWithdrawn, "Withdrawal exceeds deposits");
        totalDeposited -= amountWithdrawn;

        // Decrease the token price based on reduced deposit and current supply
        uint256 supply = token.totalSupply();
        tokenPrice = initialTokenPrice - (totalDeposited * 1e18 / supply) / 10; // Arbitrary function for price decrease
        
        emit PriceUpdated(tokenPrice);
    }

    // Get current token price
    function getTokenPrice() external view returns (uint256) {
        return tokenPrice;
    }
}
