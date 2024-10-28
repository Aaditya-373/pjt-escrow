const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const CompanyRegistry = await hre.ethers.getContractFactory("CompanyRegistry");
    const companyRegistry = await CompanyRegistry.deploy();
    await companyRegistry.deployTransaction.wait();
    console.log("CompanyRegistry deployed to:", companyRegistry.address);

    // Save CompanyRegistry address to a config file
    fs.writeFileSync("config.js", `module.exports = { companyRegistryAddress: "${companyRegistry.address}" };`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
