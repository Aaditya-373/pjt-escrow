const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const EscrowWallet = await hre.ethers.getContractFactory("EscrowWallet");

    // Deploy the contract
    const escrowWallet = await EscrowWallet.deploy();

    // Wait for the deployment to complete by waiting for at least 1 block confirmation
    await escrowWallet.deployTransaction.wait(); // Waits for the transaction to be mined

    // Log the address of the deployed contract
    console.log("EscrowWallet deployed to:", escrowWallet.address);
}

// Main function pattern
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
