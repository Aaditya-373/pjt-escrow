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

    // Deploy DemandBasedToken contract with an initial price (set to 0.01 ETH)
    const initialDemandTokenPrice = hre.ethers.utils.parseUnits("0.01", "ether"); // Change this value as needed
    const DemandBasedToken = await hre.ethers.getContractFactory("DemandBasedToken");
    const demandBasedToken = await DemandBasedToken.deploy(initialDemandTokenPrice);
    await demandBasedToken.deployTransaction.wait();
    console.log("DemandBasedToken deployed to:", demandBasedToken.address);

    // Deploy TokenPriceManager contract
    const initialPrice = hre.ethers.utils.parseUnits("0.01", "ether"); // Change this value as needed
    const TokenPriceManager = await hre.ethers.getContractFactory("TokenPriceManager");
    const tokenPriceManager = await TokenPriceManager.deploy(token.address, escrowWallet.address, escrowWallet.address, initialPrice);
    await tokenPriceManager.deployTransaction.wait();
    console.log("TokenPriceManager deployed to:", tokenPriceManager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
