const hre = require("hardhat");
const dotenv = require("dotenv");
const { companyRegistryAddress, companyAccountAddress } = require("../config");

dotenv.config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Attach to the CompanyRegistry contract
  const companyRegistry = await hre.ethers.getContractAt(
    "CompanyRegistry",
    companyRegistryAddress
  );

  // Deploy DemandBasedToken with the required argument
  const DemandBasedToken = await hre.ethers.getContractFactory("DemandBasedToken");
  const initialPrice = hre.ethers.utils.parseUnits("0.01", "ether");
  const demandBasedToken = await DemandBasedToken.deploy(initialPrice);
  await demandBasedToken.deployed();
  console.log("DemandBasedToken deployed to:", demandBasedToken.address);

  // Deploy EscrowWallet with the required arguments
  const EscrowWallet = await hre.ethers.getContractFactory("EscrowWallet");
  const escrowWallet = await EscrowWallet.deploy(
    demandBasedToken.address,  // Token address
    companyAccountAddress,     // Company account address
    companyRegistryAddress     // CompanyRegistry address
  );
  await escrowWallet.deployed();
  console.log("EscrowWallet deployed to:", escrowWallet.address);

  // Grant MINTER_ROLE to EscrowWallet
  const MINTER_ROLE = hre.ethers.utils.id("MINTER_ROLE");
  const grantMintRoleTx = await demandBasedToken.grantRole(MINTER_ROLE, escrowWallet.address);
  await grantMintRoleTx.wait();
  console.log("EscrowWallet granted permission to mint tokens.");

  // Register the company in CompanyRegistry
  const companyName = process.env.COMPANY_NAME || "New Company";
  const registerTx = await companyRegistry.registerCompany(
    companyName,               // Company name
    escrowWallet.address,      // EscrowWallet address
    demandBasedToken.address   // Token address
  );
  await registerTx.wait();
  console.log(`${companyName} registered in CompanyRegistry`);
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
