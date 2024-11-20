// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DemandBasedToken.sol";
import "./CompanyRegistry.sol";

contract EscrowWallet {
    address public owner;
    DemandBasedToken public token;
    CompanyRegistry public companyRegistry;
    address public companyAccount;
    uint256 public lastTokenPrice;

    // Track cooldown times for withdrawal types
    mapping(address => uint256) public withdrawalCooldown; // stores the last withdrawal timestamp for each user
    mapping(address => uint256) public lastWithdrawalTime;
    mapping(address => uint256) public pacedWithdrawalAmounts;
    mapping(address => uint256) public fullWithdrawalAmounts;

    event DepositMade(address indexed investor, uint256 amount, uint256 tokensMinted);
    event FundsReleased(address indexed user, uint256 amount, string withdrawalType);

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

        companyRegistry.updateReputation(address(this), msg.value, tokenPriceIncrease);

        emit DepositMade(msg.sender, msg.value, tokensToMint);

        uint256 companyShare = (msg.value * 10) / 100;
        (bool success, ) = companyAccount.call{value: companyShare}("");
        require(success, "Payment to company failed");
    }

    function immediateWithdrawal(address payable user) external {
        require(block.timestamp >= withdrawalCooldown[user], "Cooldown period not over");

        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficient contract balance");

        uint256 withdrawalAmount = (balance * 10) / 100;
        require(withdrawalAmount > 0, "Zero withdrawal amount");

        (bool success, ) = user.call{value: withdrawalAmount}("");
        require(success, "Immediate withdrawal failed");

        emit FundsReleased(user, withdrawalAmount, "Immediate");

        // Update reputation
        companyRegistry.updateReputationDecrease(address(this), withdrawalAmount);

        // **Update token price**
        token.updatePriceOnWithdraw(withdrawalAmount);

        //lastWithdrawalTime[user] = block.timestamp;
        //withdrawalCooldown[user] = block.timestamp;
    }


    function pacedWithdrawal(address payable user) external {
        require(block.timestamp >= withdrawalCooldown[user], "Cooldown period not over");

        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficient contract balance");

        uint256 allowedAmount = (balance * 70) / 100;
        uint256 elapsed = block.timestamp - lastWithdrawalTime[user];
        require(elapsed >= 24 hours, "Paced withdrawal not available yet");

        uint256 amountToWithdraw;
        if (elapsed >= 48 hours) {
            amountToWithdraw = (allowedAmount * 20) / 70;
        } else if (elapsed >= 24 hours) {
            amountToWithdraw = (allowedAmount * 30) / 70;
        } else {
            amountToWithdraw = (allowedAmount * 20) / 70;
        }

        pacedWithdrawalAmounts[user] += amountToWithdraw;
        require(pacedWithdrawalAmounts[user] <= allowedAmount, "Exceeds paced limit");

        lastWithdrawalTime[user] = block.timestamp;

        (bool success, ) = user.call{value: amountToWithdraw}("");
        require(success, "Paced withdrawal failed");

        emit FundsReleased(user, amountToWithdraw, "Paced");

        // Update reputation
        companyRegistry.updateReputationDecrease(address(this), amountToWithdraw);

        // **Update token price**
        token.updatePriceOnWithdraw(amountToWithdraw);

        withdrawalCooldown[user] = block.timestamp + 1 days;
    }


    function fullWithdrawal(address payable user) external {
        require(block.timestamp >= withdrawalCooldown[user], "Cooldown period not over");

        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficient contract balance");

        uint256 allowedAmount = (balance * 10) / 100;
        uint256 elapsed = block.timestamp - lastWithdrawalTime[user];
        require(elapsed >= 24 hours, "Daily withdrawal not available yet");

        fullWithdrawalAmounts[user] += allowedAmount;
        require(fullWithdrawalAmounts[user] <= balance, "Exceeds full withdrawal limit");

        lastWithdrawalTime[user] = block.timestamp;

        (bool success, ) = user.call{value: allowedAmount}("");
        require(success, "Full withdrawal failed");

        emit FundsReleased(user, allowedAmount, "Full");

        // Update reputation
        companyRegistry.updateReputationDecrease(address(this), allowedAmount);

        // **Update token price**
        token.updatePriceOnWithdraw(allowedAmount);

        withdrawalCooldown[user] = block.timestamp + 2 days;
    }


}
