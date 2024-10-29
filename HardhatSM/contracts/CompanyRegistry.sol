// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CompanyRegistry {
    struct Company {
        string name;
        address escrowAddress;
        address tokenAddress;
        bool isRegistered;
    }

    mapping(address => Company) public companies;
    address[] public registeredCompanies;

    event CompanyRegistered(string name, address escrowAddress, address tokenAddress);

    function registerCompany(string memory _name, address _escrowAddress, address _tokenAddress) public {
        require(!companies[_escrowAddress].isRegistered, "Company already registered");

        companies[_escrowAddress] = Company(_name, _escrowAddress, _tokenAddress, true);
        registeredCompanies.push(_escrowAddress);

        emit CompanyRegistered(_name, _escrowAddress, _tokenAddress);
    }

    function getRegisteredCompanies() public view returns (address[] memory) {
        return registeredCompanies;
    }
}