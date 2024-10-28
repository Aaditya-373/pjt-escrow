// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Escrow.sol";

contract TokenPriceManager {
    IERC20 public token;
    EscrowWallet public escrow;
    address public beneficiary;
    uint256 public tokenPrice;
    uint256 public initialTokenPrice;
    uint256 public totalDeposited;

    event PriceUpdated(uint256 newPrice);
    event MilestonePayment(address indexed beneficiary, uint256 amount);

    constructor(address _token, address _escrow, address _beneficiary, uint256 _initialPrice) payable {
        token = IERC20(_token);
        escrow = EscrowWallet(_escrow);
        beneficiary = _beneficiary;
        tokenPrice = _initialPrice;
        initialTokenPrice = _initialPrice;
    }

    // Allow the contract to receive ether
    receive() external payable {}

    function updatePriceOnDeposit(uint256 amountDeposited) external {
        totalDeposited += amountDeposited;
        
        uint256 tokensBought = (amountDeposited * 100) / tokenPrice; 
        uint256 priceIncrements = tokensBought / 100;

        tokenPrice += priceIncrements * 0.1 ether;

        emit PriceUpdated(tokenPrice);

        uint256 milestoneIncrement = initialTokenPrice * 11 / 10;
        if (tokenPrice >= milestoneIncrement) {
            uint256 payout = amountDeposited / 10;
            require(address(this).balance >= payout, "Insufficient contract funds");

            (bool sent, ) = beneficiary.call{value: payout}("");
            require(sent, "Payment to beneficiary failed");
            emit MilestonePayment(beneficiary, payout);

            initialTokenPrice = milestoneIncrement;
        }
    }

    function updatePriceOnWithdrawal(uint256 amountWithdrawn) external {
        require(totalDeposited >= amountWithdrawn, "Withdrawal exceeds deposits");
        totalDeposited -= amountWithdrawn;

        uint256 tokensSold = (amountWithdrawn * 100) / tokenPrice;
        uint256 priceDecrements = tokensSold / 100;

        tokenPrice = tokenPrice > priceDecrements * 0.1 ether ? tokenPrice - (priceDecrements * 0.1 ether) : initialTokenPrice;

        emit PriceUpdated(tokenPrice);
    }

    function getTokenPrice() external view returns (uint256) {
        return tokenPrice;
    }
}
