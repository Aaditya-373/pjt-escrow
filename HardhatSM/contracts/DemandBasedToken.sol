// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DemandBasedToken is ERC20 {
    address public owner;
    uint256 public tokenPrice;       // Token price in wei (initial price in ETH)
    uint256 public totalDeposited;   // Total ETH deposited
    uint256 public totalWithdrawn;   // Total ETH withdrawn
    uint256 public initialPrice;     // Initial price of the token in wei

    event TokensMinted(address indexed buyer, uint256 amount, uint256 price);
    event TokensWithdrawn(address indexed seller, uint256 amount, uint256 price);
    event PriceUpdated(uint256 newPrice);

    constructor(uint256 _initialPrice) ERC20("DemandBasedToken", "DBT") {
        owner = msg.sender;
        initialPrice = _initialPrice;
        tokenPrice = _initialPrice;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    // Function for users to buy tokens
    function mintTokens() public payable {
        require(msg.value > 0, "Must send ETH to buy tokens");

        uint256 tokensToMint = msg.value * 1e18 / tokenPrice; // Calculate tokens based on current price
        totalDeposited += msg.value;  // Increase total ETH deposited
        _mint(msg.sender, tokensToMint);

        updatePriceOnMint(); // Update price after minting
        emit TokensMinted(msg.sender, tokensToMint, tokenPrice);
    }

    // Function to adjust price based on minting demand
    function updatePriceOnMint() internal {
        uint256 supply = totalSupply();
        tokenPrice = initialPrice + (totalDeposited * 1e18 / supply) / 10; // Increase based on demand
        emit PriceUpdated(tokenPrice);
    }

    // Function to allow token holders to sell tokens and get back ETH
    function withdrawTokens(uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "Not enough tokens to withdraw");

        uint256 ethAmount = amount * tokenPrice / 1e18; // Calculate ETH amount based on current price
        require(address(this).balance >= ethAmount, "Contract has insufficient ETH");

        totalWithdrawn += ethAmount; // Track ETH withdrawn
        _burn(msg.sender, amount);    // Burn tokens from sender
        payable(msg.sender).transfer(ethAmount); // Send ETH to sender

        updatePriceOnWithdraw(); // Update price after withdrawal
        emit TokensWithdrawn(msg.sender, amount, tokenPrice);
    }

    // Function to adjust price based on supply reduction (withdrawal demand)
    function updatePriceOnWithdraw() internal {
        uint256 supply = totalSupply();
        tokenPrice = initialPrice - (totalWithdrawn * 1e18 / supply) / 10; // Decrease based on withdrawal
        emit PriceUpdated(tokenPrice);
    }

    // Function for the owner to deposit ETH into the contract for liquidity
    function depositLiquidity() public payable onlyOwner {
        require(msg.value > 0, "Must send ETH to add liquidity");
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
