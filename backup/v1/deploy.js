const hre = require("hardhat");
const { companyRegistryAddress, companyAccountAddress } = require("../config");
const dotenv = require("dotenv");
const inquirer = require("inquirer");
dotenv.config()

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const companyRegistry = await hre.ethers.getContractAt(
    "CompanyRegistry",
    companyRegistryAddress
  );

  // Deploy DemandBasedToken with initial token price
  const DemandBasedToken = await hre.ethers.getContractFactory("DemandBasedToken");
  const demandBasedToken = await DemandBasedToken.deploy(
    hre.ethers.utils.parseUnits("0.01", "ether")
  );
  await demandBasedToken.deployed();
  console.log("DemandBasedToken deployed to:", demandBasedToken.address);

  // Deploy the new EscrowWallet without milestones
  const EscrowWallet = await hre.ethers.getContractFactory("EscrowWallet");
  // const escrowWallet = await EscrowWallet.deploy(
  //   demandBasedToken.address,
  //   companyAccountAddress
  // );
  const escrowWallet = await EscrowWallet.deploy(
    demandBasedToken.address,
    companyAccountAddress,
    companyRegistryAddress  // Pass CompanyRegistry address
);
await escrowWallet.deployed();

  await escrowWallet.deployed();
  console.log("EscrowWallet deployed to:", escrowWallet.address);

  // Grant MINTER_ROLE to EscrowWallet
  const grantMintRoleTx = await demandBasedToken.grantRole(
    hre.ethers.utils.id("MINTER_ROLE"),
    escrowWallet.address
  );
  await grantMintRoleTx.wait();
  console.log("EscrowWallet granted permission to mint tokens.");

  // Register the company with CompanyRegistry

  // $env:COMPANY_NAME = "Accenture Kannan"; npx hardhat run scripts/deploy.js --network localhost
  // const companyName = process.env.COMPANY_NAME|| "New Company";
  // const COMPANY_NAME = await inquirer.prompt([
  //   {
  //     type: "input",
  //     name: "companyName",
  //     message: "Enter the company name:",
  //   },
  // ]);
  
  const companyName = process.env.COMPANY_NAME || "New Company";

  const tx = await companyRegistry.registerCompany(
    companyName,
    escrowWallet.address,
    demandBasedToken.address
  );
  await tx.wait();
  console.log(`${companyName} registered in CompanyRegistry`);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
