import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import EscrowWallet from "./abis/EscrowWallet.json";
import Token from "./abis/Token.json";
import './App.css'; // Import your CSS file for styling
import Balance from "./Balance";

const App = () => {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [investments, setInvestments] = useState([]);
  const [escrowAddress, setEscrowAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenPrice, setTokenPrice] = useState(100); // Default token price, 1 ETH = 100 tokens
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const loadProvider = async () => {
      const { ethereum } = window;
      if (!ethereum) return;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    };

    // Load investments from localStorage
    const savedInvestments = localStorage.getItem("investments");
    if (savedInvestments) {
      setInvestments(JSON.parse(savedInvestments));
    }

    loadProvider();
  }, []);

  const handleDeposit = async () => {
    if (!escrowAddress || !tokenAddress || !amount || !phoneNumber) {
      alert("Please enter all required fields.");
      return;
    }

    setLoading(true);

    // Step 1: Send OTP
    try {
      const otpResponse = await fetch('http://localhost:5000/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      console.log(otpResponse)
      if (!otpResponse.ok) {
        throw new Error('Failed to send OTP');
      }
      
      setOtpSent(true);
      alert('OTP sent successfully! Please check your phone.');
      let x=prompt("Please Enter your OTP :")
      setOtp(x)
      console.log("Escrow address: ", escrowAddress);
      console.log("Token address: ", tokenAddress);
      console.log("Amount to deposit: ", amount);

      // Interact with EscrowWallet: deposit ETH
      const escrowContract = new ethers.Contract(escrowAddress, EscrowWallet.abi, signer);
      const depositTx = await escrowContract.deposit({ value: ethers.utils.parseEther(amount) });
      await depositTx.wait();
      console.log("Deposit transaction successful:", depositTx);

      // Interact with Token contract: mint tokens based on ETH amount
      const tokenContract = new ethers.Contract(tokenAddress, Token.abi, signer);

      const tokenAmount = (amount * tokenPrice).toFixed(0); // Token calculation based on current price
      console.log("Minting tokens: ", tokenAmount);

      const mintTx = await tokenContract.mint(account, ethers.utils.parseUnits(tokenAmount, 18));
      await mintTx.wait();
      console.log("Mint transaction successful:", mintTx);

      // Record the investment with relevant details
      const newInvestment = {
        company: `Company ${investments.length + 1}`, // Dynamically generate company name
        escrowAddress: escrowAddress,
        amountDeposited: amount,
        tokensReceived: tokenAmount,
        tokenPrice: tokenPrice,
      };

      // Update state and localStorage
      const updatedInvestments = [...investments, newInvestment];
      setInvestments(updatedInvestments);
      localStorage.setItem("investments", JSON.stringify(updatedInvestments)); // Save to localStorage

      // Reset the form
      setAmount("");
      alert("Deposit and minting successful!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert(error.message);
      setLoading(false);
      return;
    }
    // Step 2: Verify OTP and then proceed with the deposit
    if (otpSent) {
      try {
        const verifyResponse = await fetch('http://localhost:5000/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({phoneNumber:phoneNumber,otp: otp }),
        });

        if (!verifyResponse.ok) {
          throw new Error('Invalid OTP. Please try again.');
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        console.log("Escrow address: ", escrowAddress);
        console.log("Token address: ", tokenAddress);
        console.log("Amount to deposit: ", amount);

        // Interact with EscrowWallet: deposit ETH
        const escrowContract = new ethers.Contract(escrowAddress, EscrowWallet.abi, signer);
        const depositTx = await escrowContract.deposit({ value: ethers.utils.parseEther(amount) });
        await depositTx.wait();
        console.log("Deposit transaction successful:", depositTx);

        // Interact with Token contract: mint tokens based on ETH amount
        const tokenContract = new ethers.Contract(tokenAddress, Token.abi, signer);
        
        const tokenAmount = (amount * tokenPrice).toFixed(0); // Token calculation based on current price
        console.log("Minting tokens: ", tokenAmount);

        const mintTx = await tokenContract.mint(account, ethers.utils.parseUnits(tokenAmount, 18));
        await mintTx.wait();
        console.log("Mint transaction successful:", mintTx);

        // Record the investment with relevant details
        setInvestments([
          ...investments,
          {
            company: `Company ${investments.length + 1}`, // Dynamically generate company name
            escrowAddress: escrowAddress,
            amountDeposited: amount,
            tokensReceived: tokenAmount,
            tokenPrice: tokenPrice,
          },
        ]);

        // Reset the form
        setAmount("");
        setOtp("");
        setOtpSent(false);
        alert("Deposit and minting successful!");

      } catch (error) {
        console.error("Error during deposit or token minting:", error);
        alert(`An error occurred during deposit or token minting: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>ICO Dashboard</h1>
        <button className="connect-wallet">Connected Wallet: {account || "Connect"}</button>
      </header>
      <div>
        <Balance/>
      </div>
      <div className="container">
        <div className="investment-form">
          <h2>Invest in a Company</h2>
          <input
            type="text"
            placeholder="Escrow Wallet Address"
            value={escrowAddress}
            onChange={(e) => setEscrowAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="Token Address"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button className="deposit-button" onClick={handleDeposit} >
            "Deposit ETH & Mint Tokens"
          </button>
        </div>

        <div className="investments-summary">
          <h2>Your Investments</h2>
          <div className="investment-list">
            {investments.length > 0 ? (
              investments.map((investment, index) => (
                <div className="investment-card" key={index}>
                  <h4>{investment.company}</h4>
                  <p>Escrow Wallet Address: {investment.escrowAddress}</p>
                  <p>Amount Deposited: {investment.amountDeposited} ETH</p>
                  <p>Tokens Received: {investment.tokensReceived}</p>
                  <p>Current Token Price: {investment.tokenPrice} tokens/ETH</p>
                </div>
              ))
            ) : (
              <p>No investments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
