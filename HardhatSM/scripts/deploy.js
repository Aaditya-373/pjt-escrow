const hre = require("hardhat");
const fs = require("fs");
const {
  companyRegistryAddress,
} = require("../config");

const {
  appendCompany,
  appendEscrowToCompany,
  companyExists,
  getCompanyAccount,
  getCompanyToken,
} = require("../updateConfig");

const dotenv = require("dotenv");
dotenv.config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const companyName = process.env.COMPANY_NAME || "Default Company";
  const id = process.env.ID || "1";
  const cAA =
    process.env.COMPANY_ACCOUNT || "0x3094bdadb972819B5D8E9e1E7fb5963827BDccdd";

  let companyAccount, demandBasedTokenAddress;
  let existValue = companyExists(companyName)
  if (existValue) {
    // If company exists, get its token address
    companyAccount = getCompanyAccount(companyName);
    demandBasedTokenAddress = getCompanyToken(companyName);
    console.log("hiif");
    console.log(demandBasedTokenAddress);
  } else {
    // First-time company registration: Deploy a token for this company
    const DemandBasedToken = await hre.ethers.getContractFactory(
      "DemandBasedToken"
    );
    const demandBasedToken = await DemandBasedToken.deploy(
      hre.ethers.utils.parseUnits("0.01", "ether")
    );
    await demandBasedToken.deployed();
    demandBasedTokenAddress = demandBasedToken.address;

    console.log("DemandBasedToken deployed to:", demandBasedTokenAddress);

    const companyDetails = {
      account: cAA,
      token: demandBasedTokenAddress,
      escrows: {},
    };
    appendCompany(companyName, companyDetails);

    // Grant the deployer permission to mint tokens
    await demandBasedToken.grantRole(
      hre.ethers.utils.id("MINTER_ROLE"),
      deployer.address
    );
  }

  // Deploy the EscrowWallet contract linked to the existing token
  companyAccount = getCompanyAccount(companyName);
  const EscrowWallet = await hre.ethers.getContractFactory("EscrowWallet");
  const escrowWallet = await EscrowWallet.deploy(
    demandBasedTokenAddress,
    companyAccount,
    companyRegistryAddress  
  );
  await escrowWallet.deployed();

  // Append escrow details to the config
  appendEscrowToCompany(companyName, id, escrowWallet.address);
  console.log("EscrowWallet deployed to:", escrowWallet.address);


  

  if (!existValue) {
    const companyRegistry = await hre.ethers.getContractAt(
      "CompanyRegistry",
      companyRegistryAddress
    );
    const registerTx = await companyRegistry.registerCompany(
      companyName,
      escrowWallet.address,
      demandBasedTokenAddress,
      id
    );
    await registerTx.wait();
    console.log(`${companyName} registered in CompanyRegistry.`);

  }

  const companyRegistry = await hre.ethers.getContractAt(
    "CompanyRegistry",
    companyRegistryAddress
  );
  const registeredCompanies = await companyRegistry.getRegisteredCompanies();
  console.log("Registered Companies:", registeredCompanies);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// $env:COMPANY_NAME = "SEN Tokens"; $env:COMPANY_ACCOUNT = "0xdB9EC082166Fe74E3DcA5cade70e578a9aaB3342"; $env:ID = "2"; npx hardhat run scripts/deploy.js --network localhost
