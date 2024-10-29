const hre = require("hardhat");
const { companyRegistryAddress, companyAccountAddress } = require("../config");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const companyRegistry = await hre.ethers.getContractAt(
    "CompanyRegistry",
    companyRegistryAddress
  );

  const DemandBasedToken = await ethers.getContractFactory("DemandBasedToken");
  const demandBasedToken = await DemandBasedToken.deploy(
    hre.ethers.utils.parseUnits("0.01", "ether")
  );
  await demandBasedToken.deployed();
  console.log("DemandBasedToken deployed to:", demandBasedToken.address);

  const EscrowWallet = await ethers.getContractFactory("EscrowWallet");

  const escrowWallet = await EscrowWallet.deploy(
    demandBasedToken.address,
    companyAccountAddress
  );
  await escrowWallet.deployed();
  console.log("EscrowWallet deployed to:", escrowWallet.address);

  // Grant MINTER_ROLE to EscrowWallet
  const grantMintRoleTx = await demandBasedToken.grantRole(
    hre.ethers.utils.id("MINTER_ROLE"),
    escrowWallet.address
  );
  await grantMintRoleTx.wait();
  console.log("EscrowWallet granted permission to mint tokens.");

  const setMilestoneTx = await escrowWallet.setMilestone(5);
  await setMilestoneTx.wait();
  console.log("Milestones set in EscrowWallet");

  const companyName = process.argv[2] || "New Company";
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
