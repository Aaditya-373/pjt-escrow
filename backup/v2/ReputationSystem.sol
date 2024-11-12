// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReputationSystem {
    struct CompanyReputation {
        uint256 score;
        address[] escrowWallets;
    }

    mapping(address => CompanyReputation) public reputations;
    address[] public companyAddresses;

    event ReputationUpdated(address indexed company, uint256 newScore);
    event EscrowWalletLinked(address indexed company, address escrowWallet);

    function linkEscrowWallet(address company, address escrowWallet) public {
        reputations[company].escrowWallets.push(escrowWallet);
        if (reputations[company].score == 0) {
            companyAddresses.push(company);
        }
        emit EscrowWalletLinked(company, escrowWallet);
    }

    function updateReputation(address company, uint256 points) public {
        reputations[company].score += points;
        emit ReputationUpdated(company, reputations[company].score);
    }

    function getCompaniesWithScores() public view returns (address[] memory, uint256[] memory) {
        uint256[] memory scores = new uint256[](companyAddresses.length);
        for (uint256 i = 0; i < companyAddresses.length; i++) {
            scores[i] = reputations[companyAddresses[i]].score;
        }
        return (companyAddresses, scores);
    }
}
