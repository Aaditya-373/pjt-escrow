// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CompanyRegistry {
    struct Company {
        string name;
        address escrowAddress;
        address tokenAddress;
        string accountId;
        bool isRegistered;
        uint256 reputation;  // New reputation variable
    }

    mapping(address => Company) public companies;
    address[] public registeredCompanies;

    event CompanyRegistered(string name, address escrowAddress, address tokenAddress, string accountId);
    event ReputationUpdated(address escrowAddress, uint256 newReputation);  // Event for reputation updates

    function registerCompany(
        string memory _name, 
        address _escrowAddress, 
        address _tokenAddress, 
        string memory _accountId  
    ) public {
        require(!companies[_escrowAddress].isRegistered, "Company already registered");

        companies[_escrowAddress] = Company(_name, _escrowAddress, _tokenAddress, _accountId, true, 0);  // Initialize reputation to 0
        registeredCompanies.push(_escrowAddress);
        emit CompanyRegistered(_name, _escrowAddress, _tokenAddress, _accountId);
    }

    function getRegisteredCompanies() public view returns (address[] memory) {
        return registeredCompanies;
    }

    // Get company details by escrow address
    function getCompanyDetails(address _escrowAddress) public view returns (string memory name, address escrowAddress, address tokenAddress, string memory accountId, uint256 reputation) {
        Company memory company = companies[_escrowAddress];
        return (company.name, company.escrowAddress, company.tokenAddress, company.accountId, company.reputation);
    }

    // Function to increase reputation score by 10
    function increaseReputation(address _companyAccount) public {
        require(companies[_companyAccount].isRegistered, "Company not registered");
        companies[_companyAccount].reputation += 10;
        emit ReputationUpdated(_companyAccount, companies[_companyAccount].reputation);
    }
}
