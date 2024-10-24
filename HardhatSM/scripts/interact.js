const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
    // Escrow and Token contract addresses
    const escrowContractAddress = "0x8A2B8D8997DBC1f3e0E09aBCD222Aaa97F626e05"; 
    const tokenContractAddress = "0x4B38907284a35E5E7cFc4B75d94acF6129f4EB29";
    const EscrowWallet = await hre.ethers.getContractAt("EscrowWallet", escrowContractAddress);
    const Token = await hre.ethers.getContractAt("Token", tokenContractAddress);
    const contractBalance = await EscrowWallet.getBalance();
    console.log("Escrow wallet balance:", ethers.utils.formatEther(contractBalance.toString()), "ETH");
    const depositTx = await EscrowWallet.deposit({ value: ethers.utils.parseEther("1") });
    await depositTx.wait(); // Wait for confirmation
    console.log("Deposited 1 ETH into escrow wallet");
    const investorAddress = "0x31742cbafCD8AF2285016210Aad6D320b0E2E36F"; // Replace with the investor's address (e.g., your MetaMask account)
    const tokenAmount = ethers.utils.parseUnits("10", 18); // Issue 100 tokens
    const approvalTx = await Token.approve(escrowContractAddress, tokenAmount);
    await approvalTx.wait(); // Wait for the approval transaction to be confirmed
    console.log(`Approved ${ethers.utils.formatUnits(tokenAmount, 18)} tokens for escrow`);
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
