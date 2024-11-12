// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DemandBasedToken.sol";

contract EscrowWallet {
    address public owner;
    DemandBasedToken public token; // Token contract reference
    uint public milestoneCount;
    uint public currentMilestone;
    uint public lastTokenPrice;
    address public companyAccount;

    event DepositMade(address indexed investor, uint256 amount, uint256 tokensMinted);
    event FundsReleased(uint amount);

    constructor(address _token, address _companyAccount) {
        owner = msg.sender;
        token = DemandBasedToken(_token);
        companyAccount = _companyAccount;
        lastTokenPrice = token.tokenPrice();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function deposit() external payable {
        require(msg.value > 0, "Must deposit some funds");

        uint256 tokensToMint = (msg.value * 1e18) / token.tokenPrice();
        token.mintTokens(msg.sender, tokensToMint);

        emit DepositMade(msg.sender, msg.value, tokensToMint);

        // Transfer 10% of deposit amount to the company account
        uint256 companyShare = (msg.value * 10) / 100;
        payable(companyAccount).transfer(companyShare);

        // Check for the token price increase milestone
        uint256 newTokenPrice = token.tokenPrice();
        if (newTokenPrice >= lastTokenPrice + 0.0000000000000001 ether) {
            lastTokenPrice = newTokenPrice;
            releaseFunds();
        }
    }

    function releaseFunds() internal {
        uint256 balance = address(this).balance;
        uint256 companyPayout = (balance * 10) / 100;
        payable(companyAccount).transfer(companyPayout);
        emit FundsReleased(companyPayout);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
