// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EscrowWallet {
    address public owner;
    address public investor;
    uint public milestoneCount;
    bool public milestoneMet;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        require(msg.value > 0, "Must deposit some funds");
    }

    function setMilestone(uint _milestoneCount) public {
        require(msg.sender == owner, "Only the owner can set milestones");
        milestoneCount = _milestoneCount;
    }

    function approveMilestone() public {
        require(msg.sender == investor, "Only the investor can approve milestones");
        milestoneMet = true;
    }

    function releaseFunds() public {
        require(milestoneMet, "Milestone not yet met");
        payable(owner).transfer(address(this).balance);
        milestoneMet = false;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
