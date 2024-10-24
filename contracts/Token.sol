// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    address public owner;

    constructor(uint256 initialSupply) ERC20("ICO Token", "ICT") {
        owner = msg.sender;
        _mint(owner, initialSupply);  // Mint initial supply to owner
    }

    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        _mint(to, amount);  // Mint tokens to the provided address
    }
}
