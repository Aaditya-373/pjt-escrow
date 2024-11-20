// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CompanyRegistry {
    struct Company {
        string name;
        address escrowAddress;
        address tokenAddress;
        uint256 totalDeposits; // New field for total deposits
        uint256 reputationScore; // New field for reputation score
        bool isRegistered;
    }

    mapping(address => Company) public companies;
    address[] public registeredCompanies;

    event CompanyRegistered(string name, address escrowAddress, address tokenAddress);
    event ReputationUpdated(address indexed escrowAddress, uint256 reputationScore);

    function registerCompany(
        string memory _name,
        address _escrowAddress,
        address _tokenAddress
    ) public {
        require(!companies[_escrowAddress].isRegistered, "Company already registered");

        companies[_escrowAddress] = Company({
            name: _name,
            escrowAddress: _escrowAddress,
            tokenAddress: _tokenAddress,
            totalDeposits: 0,
            reputationScore: 0,
            isRegistered: true
        });
        registeredCompanies.push(_escrowAddress);

        emit CompanyRegistered(_name, _escrowAddress, _tokenAddress);
    }

    function getRegisteredCompanies() public view returns (address[] memory) {
        return registeredCompanies;
    }

    function updateReputation(
        address _escrowAddress,
        uint256 depositAmount,
        uint256 tokenPriceIncrease
    ) public {
        require(companies[_escrowAddress].isRegistered, "Company not registered");

        Company storage company = companies[_escrowAddress];
        company.totalDeposits += depositAmount;

        // Calculate reputation score (weight: deposits 70%, token price increase 30%)
        company.reputationScore = (company.totalDeposits / 1 ether) * 70 +
            tokenPriceIncrease * 30;

        emit ReputationUpdated(_escrowAddress, company.reputationScore);
    }

    // New function to decrease reputation on withdrawal
    function updateReputationDecrease(
        address _escrowAddress,
        uint256 withdrawalAmount
    ) public {
        require(companies[_escrowAddress].isRegistered, "Company not registered");

        Company storage company = companies[_escrowAddress];

        // Proportionally decrease reputation score based on withdrawal
        uint256 totalDeposits = company.totalDeposits;
        require(totalDeposits > 0, "No deposits to calculate reputation decrease");

        uint256 decreaseAmount = (withdrawalAmount * company.reputationScore) / totalDeposits;

        if (company.reputationScore > decreaseAmount) {
            company.reputationScore -= decreaseAmount;
        } else {
            company.reputationScore = 0; // Prevent underflow
        }

        emit ReputationUpdated(_escrowAddress, company.reputationScore);
    }


    function getCompaniesByReputation() public view returns (Company[] memory) {
        Company[] memory sortedCompanies = new Company[](registeredCompanies.length);
        for (uint256 i = 0; i < registeredCompanies.length; i++) {
            sortedCompanies[i] = companies[registeredCompanies[i]];
        }

        // Sort by reputation score (descending order)
        for (uint256 i = 0; i < sortedCompanies.length; i++) {
            for (uint256 j = i + 1; j < sortedCompanies.length; j++) {
                if (sortedCompanies[j].reputationScore > sortedCompanies[i].reputationScore) {
                    Company memory temp = sortedCompanies[i];
                    sortedCompanies[i] = sortedCompanies[j];
                    sortedCompanies[j] = temp;
                }
            }
        }

        return sortedCompanies;
    }
}
