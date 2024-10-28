import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import EscrowWallet from "./abis/EscrowWallet.json";
import Token from "./abis/Token.json";
import CompanyRegistry from "./abis/CompanyRegistry.json";
import './App.css';
import Balance from "./Balance";
import Modal from "react-modal";
const { companyRegistryAddress } = require("./config"); // Import CompanyRegistry address
// Make sure you have this logo in your project

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
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    loadRegisteredCompanies();
  }, []);

  const loadRegisteredCompanies = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const companyRegistry = new ethers.Contract(companyRegistryAddress, CompanyRegistry.abi, provider);

    const companyAddresses = await companyRegistry.getRegisteredCompanies();
    const companyData = await Promise.all(companyAddresses.map(async (address) => {
      const company = await companyRegistry.companies(address);
      return {
        name: company.name,
        escrowAddress: company.escrowAddress,
        tokenAddress: company.tokenAddress
      };
    }));
    setCompanies(companyData);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleDeposit = async () => {
    if (!escrowAddress || !tokenAddress || !amount || !phoneNumber) {
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
      let x = prompt("Please Enter your OTP:");
      setOtp(x);
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    if (otpSent) {
      try {
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

        const tokenContract = new ethers.Contract(tokenAddress, Token.abi, signer);
        const tokenAmount = (amount * tokenPrice).toFixed(0);
        console.log("Minting tokens:", tokenAmount);

        const mintTx = await tokenContract.mint(account, ethers.utils.parseUnits(tokenAmount, 18));
        await mintTx.wait();
        console.log("Mint transaction successful:", mintTx);

        setInvestments([
          ...investments,
          {
            company: `Company ${investments.length + 1}`,
            escrowAddress,
            amountDeposited: amount,
            tokensReceived: tokenAmount,
            tokenPrice,
          },
        ]);

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
        <button onClick={toggleModal} className="show-companies-button">View Registered Companies</button>
      </header>
      <div><Balance /></div>
      <div className="container">
        <div className="investment-form">
          <h2>Invest in a Company</h2>
          <input type="text" placeholder="Escrow Wallet Address" value={escrowAddress} onChange={(e) => setEscrowAddress(e.target.value)} />
          <input type="text" placeholder="Token Address" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
          <input type="text" placeholder="Amount in ETH" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <button className="deposit-button" onClick={handleDeposit} disabled={loading}>
            {loading ? "Processing..." : `"Deposit ETH & Mint Tokens"`}
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
        <Modal
          isOpen={isModalOpen}
          onRequestClose={toggleModal}
          className="company-modal"
          overlayClassName="modal-overlay"  /* Custom overlay for no background */
          ariaHideApp={false}
        >
          <h2>Available Companies for Investment</h2>
          <ul>
            {companies.map((company, index) => (
              <li key={index}>
                <h3>{company.name}</h3>
                <p>Escrow Address: {company.escrowAddress}</p>
                <p>Token Address: {company.tokenAddress}</p>
              </li>
            ))}
          </ul>
          <button onClick={toggleModal}>Close</button>
        </Modal>

      </div>
    </div>
  );
};

export default App;
