// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DemandBasedToken.sol";
import "./CompanyRegistry.sol";

contract EscrowWallet {
    address public owner;
    DemandBasedToken public token;
    CompanyRegistry public companyRegistry; // Reference to CompanyRegistry
    address public companyAccount;
    uint256 public lastTokenPrice;

    event DepositMade(address indexed investor, uint256 amount, uint256 tokensMinted);
    event FundsReleased(uint256 amount);

    constructor(
        address _token,
        address _companyAccount,
        address _companyRegistry
    ) {
        owner = msg.sender;
        token = DemandBasedToken(_token);
        companyAccount = _companyAccount;
        companyRegistry = CompanyRegistry(_companyRegistry);
        lastTokenPrice = token.tokenPrice();
    }
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }


    function deposit() external payable {
        require(msg.value > 0, "Must deposit some funds");

        uint256 tokensToMint = (msg.value * 1e18) / token.tokenPrice();
        token.mintTokens(msg.sender, tokensToMint);

        uint256 tokenPriceIncrease = token.tokenPrice() > lastTokenPrice
            ? token.tokenPrice() - lastTokenPrice
            : 0;
        lastTokenPrice = token.tokenPrice();

        // Update company reputation in the registry
        companyRegistry.updateReputation(address(this), msg.value, tokenPriceIncrease);

        emit DepositMade(msg.sender, msg.value, tokensToMint);

        // Transfer 10% to the company account
        uint256 companyShare = (msg.value * 10) / 100;
        payable(companyAccount).transfer(companyShare);
    }
}
