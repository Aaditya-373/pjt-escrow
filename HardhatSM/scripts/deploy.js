const hre = require("hardhat");
const { companyRegistryAddress } = require("../config"); // Import CompanyRegistry address

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    // Load existing CompanyRegistry contract
    const CompanyRegistry = await hre.ethers.getContractFactory("CompanyRegistry");
    const companyRegistry = await CompanyRegistry.attach(companyRegistryAddress);

    // Deploy new EscrowWallet contract
    const EscrowWallet = await hre.ethers.getContractFactory("EscrowWallet");
    const escrowWallet = await EscrowWallet.deploy();
    await escrowWallet.deployTransaction.wait();
    console.log("EscrowWallet deployed to:", escrowWallet.address);

    // Deploy new Token contract
    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy(hre.ethers.utils.parseUnits("1000000", 18));
    await token.deployTransaction.wait();
    console.log("Token contract deployed to:", token.address);

    // Register the new company with the existing CompanyRegistry
    const companyName = process.argv[2] || "New Company";
    const tx = await companyRegistry.registerCompany(companyName, escrowWallet.address, token.address);
    await tx.wait();
    console.log(`${companyName} registered in CompanyRegistry`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
