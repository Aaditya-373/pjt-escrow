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


    // Deploy DemandBasedToken contract with an initial price (set to 0.01 ETH)
    const initialDemandTokenPrice = hre.ethers.utils.parseUnits("0.01", "ether"); // Change this value as needed
    const DemandBasedToken = await hre.ethers.getContractFactory("DemandBasedToken");
    const demandBasedToken = await DemandBasedToken.deploy(initialDemandTokenPrice);
    await demandBasedToken.deployTransaction.wait();
    console.log("DemandBasedToken deployed to:", demandBasedToken.address);

    // Deploy TokenPriceManager contract
    const initialPrice = hre.ethers.utils.parseUnits("0.01", "ether"); // Change this value as needed
    const TokenPriceManager = await hre.ethers.getContractFactory("TokenPriceManager");
    const tokenPriceManager = await TokenPriceManager.deploy(demandBasedToken.address, escrowWallet.address, escrowWallet.address, initialPrice);
    await tokenPriceManager.deployTransaction.wait();
    console.log("TokenPriceManager deployed to:", tokenPriceManager.address);

    // Register the new company with the existing CompanyRegistry
    const companyName = process.argv[2] || "New Company";
    const tx = await companyRegistry.registerCompany(companyName, escrowWallet.address, demandBasedToken.address);
    await tx.wait();
    console.log(`${companyName} registered in CompanyRegistry`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
