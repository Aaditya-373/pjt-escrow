const hre = require("hardhat");

async function main() {
    // Deploy EscrowWallet contract
    const EscrowWallet = await hre.ethers.getContractFactory("EscrowWallet");
    const escrowWallet = await EscrowWallet.deploy();
    await escrowWallet.deployTransaction.wait();
    console.log("EscrowWallet deployed to:", escrowWallet.address);

    // Deploy Token contract with an initial supply of 1 million tokens
    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy(hre.ethers.utils.parseUnits("1000000", 18)); // 1 million tokens
    await token.deployTransaction.wait();
    console.log("Token contract deployed to:", token.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
