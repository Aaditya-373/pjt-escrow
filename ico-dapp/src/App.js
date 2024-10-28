// export default App;
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import EscrowWallet from "./abis/EscrowWallet.json";
import DemandBasedToken from "./abis/DemandBasedToken.json"; 
import TokenPriceManager from "./abis/TokenPriceManager.json";
import './App.css';
import Balance from "./Balance";

// EscrowWallet deployed to: 0x59f6452fb1E2348E2FB3f47CDdfC211832e20C8D
// Token contract deployed to: 0xDf3a1fC41d9a80c8932B06332a6483Be407A6328
// DemandBasedToken deployed to: 0x790a63D09b36fDf133139542212D0B734C9FDef3
// TokenPriceManager deployed to: 0x6f4387411174B2f21f1808BC0887520EE56D37B5

const App = () => {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [investments, setInvestments] = useState([]);
  const [escrowAddress, setEscrowAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [priceManagerAddress, setPriceManagerAddress] = useState("");
  const [tokenPrice, setTokenPrice] = useState(100); 
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

    const savedInvestments = localStorage.getItem("investments");
    if (savedInvestments) {
      setInvestments(JSON.parse(savedInvestments));
    }

    loadProvider();
  }, [tokenPrice]);

  const handleDeposit = async () => {
    if (!escrowAddress || !tokenAddress || !priceManagerAddress || !amount || !phoneNumber) {
      alert("Please enter all required fields.");
      return;
    }

    setLoading(true);

    try {
      const otpResponse = await fetch('http://localhost:5000/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!otpResponse.ok) throw new Error('Failed to send OTP');

      setOtpSent(true);
      alert('OTP sent successfully! Please check your phone.');
      const enteredOtp = prompt("Please Enter your OTP :");
      setOtp(enteredOtp);

      if (otpSent) {
        const verifyResponse = await fetch('http://localhost:5000/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, otp }),
        });

        if (!verifyResponse.ok) throw new Error('Invalid OTP. Please try again.');

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const escrowContract = new ethers.Contract(escrowAddress, EscrowWallet.abi, signer);
        const depositTx = await escrowContract.deposit({ value: ethers.utils.parseEther(amount) });
        await depositTx.wait();
        console.log("Deposit transaction successful:", depositTx);

        const transactionDetails = `
          Transaction Hash: ${depositTx.hash}
          Senders: ${depositTx.from}
          Receivers: ${depositTx.to}
          Amount: ${amount} ETH
          Gas Used: ${depositTx.gasPrice.toString()}
          ChainID: ${depositTx.chainId}
          Block Number: ${depositTx.blockNumber}
          Nonce: ${depositTx.nonce}
        `;

        await fetch('http://localhost:5000/send-transaction-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, message: transactionDetails }),
        });

        const priceManagerContract = new ethers.Contract(priceManagerAddress, TokenPriceManager.abi, signer);
        await priceManagerContract.updatePriceOnDeposit(ethers.utils.parseEther(amount));

        const updatedPrice = await priceManagerContract.getTokenPrice();
        setTokenPrice(updatedPrice);
        console.log(updatedPrice);

        const tokenContract = new ethers.Contract(tokenAddress, DemandBasedToken.abi, signer);
        const mintTx = await tokenContract.mintTokens({ value: ethers.utils.parseEther(amount) });
        await mintTx.wait();
        console.log("Mint transaction successful:", mintTx);

        const mintDetails = `
          Transaction Hash: ${mintTx.hash}
          Senders: ${mintTx.from}
          Receivers: ${mintTx.to}
          TokenPrice: ${updatedPrice} ETH
          Tokens: ${(amount * updatedPrice).toFixed(0)}
          Amount: ${amount} ETH
          Gas Used: ${mintTx.gasPrice.toString()}
          ChainID: ${mintTx.chainId}
          Block Number: ${mintTx.blockNumber}
          Nonce: ${mintTx.nonce}
        `;

        await fetch('http://localhost:5000/send-transaction-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, message: mintDetails }),
        });

        setInvestments([
          ...investments,
          {
            company: `Company ${investments.length + 1}`,
            escrowAddress: escrowAddress,
            amountDeposited: amount,
            tokensReceived: (amount * updatedPrice).toFixed(0),
            tokenPrice: updatedPrice,
          },
        ]);

        setAmount("");
        setOtp("");
        setOtpSent(false);
        alert("Deposit and minting successful!");

      }
    } catch (error) {
      console.error("Error during deposit or token minting:", error);
      alert(`An error occurred during deposit or token minting: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>ICO Dashboard</h1>
        <button className="connect-wallet">Connected Wallet: {account || "Connect"}</button>
      </header>
      <div>
        <Balance />
      </div>
      <div className="container">
        <div className="investment-form">
          <h2>Invest in a Company</h2>
          <input type="text" placeholder="Escrow Wallet Address" value={escrowAddress} onChange={(e) => setEscrowAddress(e.target.value)} />
          <input type="text" placeholder="Token Address" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
          <input type="text" placeholder="Token Price Manager Address" value={priceManagerAddress} onChange={(e) => setPriceManagerAddress(e.target.value)} />
          <input type="text" placeholder="Amount in ETH" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          {otpSent && (
            <input type="text" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          )}
          <button className="deposit-button" onClick={handleDeposit}>
            {loading ? "Processing..." : "Deposit ETH & Mint Tokens"}
          </button>
        </div>
      </div>
      <div>
        <h2>Current Token Price: {tokenPrice.toString()} ETH</h2>
      </div>
      <div>
        <h2>Investment Records</h2>
        <ul>
          {investments.map((investment, index) => (
            <li key={index}>
              {investment.company}: {investment.amountDeposited} ETH - {investment.tokensReceived} Tokens
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
