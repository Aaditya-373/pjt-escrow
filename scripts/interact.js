const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
    // Escrow and Token contract addresses
    const escrowContractAddress = "0xC417bD949789cEc272e4FcCD3fBa6a423A24B246"; // Replace with your deployed escrow contract address
    const tokenContractAddress = "0x4e08be40F526E3E1B450eE944105530bD874f9D3"; // Replace with your deployed token contract address

    // Fetch the contract ABIs and attach to the addresses
    const EscrowWallet = await hre.ethers.getContractAt("EscrowWallet", escrowContractAddress);
    const Token = await hre.ethers.getContractAt("Token", tokenContractAddress);

    // Check balance of the escrow contract
    const contractBalance = await EscrowWallet.getBalance();
    console.log("Escrow wallet balance:", ethers.utils.formatEther(contractBalance.toString()), "ETH");

    // Deposit funds into the escrow contract (send transaction)
    const depositTx = await EscrowWallet.deposit({ value: ethers.utils.parseEther("1") });
    await depositTx.wait(); // Wait for confirmation
    console.log("Deposited 1 ETH into escrow wallet");

    // Issue tokens to the investor (who made the deposit)
    const investorAddress = "0x2c2de36A83E0b646c1a383EF128295028B0549DD"; // Replace with the investor's address (e.g., your MetaMask account)
    const tokenAmount = ethers.utils.parseUnits("100", 18); // Issue 100 tokens

    // Mint and transfer tokens to the investor
    const mintTx = await Token.mint(investorAddress, tokenAmount);
    await mintTx.wait(); // Wait for the minting transaction to be confirmed
    console.log(`Issued ${ethers.utils.formatUnits(tokenAmount, 18)} tokens to ${investorAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
