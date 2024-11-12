const hre = require("hardhat");
const fs = require("fs");
const {
    updateCompanyRegistryAddress,
    updateReputationSystemAddress,
    appendCompany,
    appendEscrowToCompany,
    updateCompanyAccountValue
  } = require('../updateConfig');



async function main() {
  const CompanyRegistry = await hre.ethers.getContractFactory("CompanyRegistry");
  const companyRegistry = await CompanyRegistry.deploy();
  await companyRegistry.deployTransaction.wait();
  
  console.log("CompanyRegistry deployed to:", companyRegistry.address);
  updateCompanyRegistryAddress(companyRegistry.address)  // Update the address
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
