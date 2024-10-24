const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
    // Address of the deployed contract
    const contractAddress = "0xfdA303Dc59e83E0303cC5334261b7F701324bFe7"; // Replace with your deployed contract address

    // Fetch the contract ABI (compiled output) and attach to the address
    const EscrowWallet = await hre.ethers.getContractAt("EscrowWallet", contractAddress);

    // Check balance of contract
    const contractBalance = await EscrowWallet.getBalance();
    console.log("Wallet balance:", ethers.utils.formatEther(contractBalance.toString()), "ETH");

    // Deposit funds into the contract (send transaction)
    const depositTx = await EscrowWallet.deposit({ value: ethers.utils.parseEther("1") }); // Deposit 1 ETH
    await depositTx.wait(); // Wait for transaction to be confirmed
    console.log("Deposited 1 ETH");

    // Check balance after deposit
    const updatedBalance = await EscrowWallet.getBalance();
    console.log("Updated escrow wallet balance:", ethers.utils.formatEther(updatedBalance.toString()), "ETH");

    // Call other functions like setMilestone or releaseFunds as needed
    // await EscrowWallet.setMilestone(2); // Example milestone set
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
