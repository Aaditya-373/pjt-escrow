import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import EscrowWallet from "./abis/EscrowWallet.json";
import DemandBasedToken from "./abis/DemandBasedToken.json";
import CompanyRegistry from "./abis/CompanyRegistry.json";
import "./App.css"; // Import your CSS file for styling
import Balance from "./Balance";
import Modal from "react-modal";
import TokenPrices from "./TokenPrices";

const { companyRegistryAddress } = require("./config");

const App = () => {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [investments, setInvestments] = useState([]);
  const [escrowAddress, setEscrowAddress] = useState("");
  const [tokenPrice, setTokenPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const loadProvider = async () => {
    const { ethereum } = window;
    if (!ethereum) return;
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);
  };


  useEffect(() => {
    
    const savedInvestments = localStorage.getItem("investments");
    if (savedInvestments) {
      setInvestments(JSON.parse(savedInvestments));
    }
    loadRegisteredCompanies();
  }, []);

  const loadRegisteredCompanies = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const companyRegistry = new ethers.Contract(
        companyRegistryAddress,
        CompanyRegistry.abi,
        provider
      );

      const companyAddresses = await companyRegistry.getRegisteredCompanies();
      const companyData = await Promise.all(
        companyAddresses.map(async (address) => {
          const company = await companyRegistry.companies(address);
          return {
            name: company.name,
            escrowAddress: company.escrowAddress,
            tokenAddress: company.tokenAddress,
          };
        })
      );
      setCompanies(companyData);
    } catch (error) {
      console.error("Error loading registered companies:", error);
      alert("Error loading registered companies. Please check the console for details.");
    }
  };
  const demandBasedTokenAddress = "0xbE979653d6725a46D6A92dbbD536665cf70669b5"
  const loadTokenPrice = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const tokenContract = new ethers.Contract(demandBasedTokenAddress, DemandBasedToken.abi, provider);
    provider.getCode("0xbE979653d6725a46D6A92dbbD536665cf70669b5")
    const price = await tokenContract.getTokenPrice(); // Fetch price from the contract
    
    setTokenPrice(ethers.utils.formatEther(price)); // Convert to ETH
  } catch (error) {
    console.error("Error fetching token price:", error);
  }
};

  useEffect(() => {
    const initialize = async () => {
      await loadProvider();
      await loadTokenPrice();
      loadRegisteredCompanies();
      const savedInvestments = localStorage.getItem("investments");
      if (savedInvestments) {
        setInvestments(JSON.parse(savedInvestments));
      }
    };
    initialize();
  }, []);

  
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      alert("Please enter your phone number.");
      return;
    }

    try {
      // Send OTP to the provided phone number
      const otpResponse = await fetch('http://localhost:5000/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!otpResponse.ok) throw new Error('Failed to send OTP');

      setOtpSent(true);
      alert('OTP sent successfully! Please check your phone.');
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert(`An error occurred while sending OTP: ${error.message}`);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Please enter the OTP sent to your phone.");
      return;
    }

    try {
      const verifyResponse = await fetch('http://localhost:5000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      if (!verifyResponse.ok) throw new Error('Invalid OTP. Please try again.');

      // If OTP is verified, proceed with the deposit
      await handleDeposit();
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert(`An error occurred during OTP verification: ${error.message}`);
    }
  };

  const handleDeposit = async () => {
    if (!escrowAddress || !amount) {
      alert("Please enter all required fields.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const escrowContract = new ethers.Contract(escrowAddress, EscrowWallet.abi, signer);

      // Deposit transaction
      const depositTx = await escrowContract.deposit({
        value: ethers.utils.parseEther(amount),
      });
      await depositTx.wait();
      console.log("Deposit transaction successful:", depositTx);
      await loadTokenPrice();
      // Add investment entry
      const investmentEntry = {
        company: `Company ${investments.length + 1}`,
        escrowAddress,
        amountDeposited: amount,
        tokensReceived: (amount / tokenPrice).toFixed(0),
        tokenPrice: tokenPrice,
      };

      const updatedInvestments = [...investments, investmentEntry];
      setInvestments(updatedInvestments);
      localStorage.setItem("investments", JSON.stringify(updatedInvestments));

      // Send investment details via SMS or any messaging service
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

      alert("Deposit successful and investment information sent!");
      setAmount("");
      setOtp("");
      setOtpSent(false);
    } catch (error) {
      console.error("Error during deposit or sending investment details:", error);
      alert(`An error occurred: ${error.message}`);
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
      <h2>Current Token Price: {tokenPrice} ETH</h2>
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
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="phone-number-container">
            <input
              type="text"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button className="send-otp-button" onClick={handleSendOtp} disabled={loading}>
              {otpSent ? "OTP Sent" : "Send OTP"}
            </button>
          </div>

          {otpSent && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button className="verify-otp-button" onClick={handleVerifyOtp}>
                Verify OTP & Deposit ETH
              </button>
            </>
          )}
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
                  <p>Current Token Price: {investment.tokenPrice} ETH/token</p>
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
          overlayClassName="modal-overlay"
          ariaHideApp={false}
        >
          <h2>Available Companies for Investment</h2>
          <div className="company-list">
            {companies.map((company, index) => (
              <div
                key={index}
                className={`company-card ${selectedCompany === index ? "selected" : ""}`}
                onClick={() => {
                  setSelectedCompany(index);
                  setEscrowAddress(company.escrowAddress);
                  toggleModal();
                }}
              >
                <h3>{company.name}</h3>
                <p><strong>Escrow Address:</strong> {company.escrowAddress}</p>
                <p><strong>Token Address:</strong> {company.tokenAddress}</p>
              </div>
            ))}
          </div>
          <button className="close-modal-button" onClick={toggleModal}>Close</button>
        </Modal>
      </div>
    </div>
  );
};

export default App;
