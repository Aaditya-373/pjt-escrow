import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import EscrowWallet from "./abis/EscrowWallet.json";
import DemandBasedToken from "./abis/DemandBasedToken.json";
import CompanyRegistry from "./abis/CompanyRegistry.json";
import "./App.css"; // Import your CSS file for styling
import Balance from "./Balance";
import Modal from "react-modal";
import TokenPrices from "./TokenPrices";
import EscrowBalance from "./Escrowbalance";

const { companyRegistryAddress } = require("./config");

const App = () => {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [investments, setInvestments] = useState([]);
  const [escrowAddress, setEscrowAddress] = useState("");
  const [tokenPrice, setTokenPrice] = useState("Select Company or Token");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [refreshTokenPrices, setRefreshTokenPrices] = useState(false);

  const loadProvider = async () => {
    const { ethereum } = window;
    if (!ethereum) return;
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
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
      alert(
        "Error loading registered companies. Please check the console for details."
      );
    }
  };

  const loadTokenPrice = async (tokenAddress) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(
        tokenAddress,
        DemandBasedToken.abi,
        provider
      );
      const price = await tokenContract.getTokenPrice();
      const formattedPrice = ethers.utils.formatEther(price);
      setTokenPrice(formattedPrice);
      return formattedPrice; // Add this return statement
    } catch (error) {
      console.error("Error fetching token price:", error);
    }
  };

  const initialize = async () => {
    await loadProvider();
    loadRegisteredCompanies();
    const savedInvestments = localStorage.getItem("investments");
    if (savedInvestments) setInvestments(JSON.parse(savedInvestments));
  };

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    // Function to update token prices from localStorage
    const updateTokenPrices = () => {
      const currentTokenPrices = JSON.parse(
        localStorage.getItem("currentTokenPrices")
      );
      if (currentTokenPrices && selectedCompany) {
        setTokenPrice(
          currentTokenPrices[selectedCompany.tokenAddress] ||
            "Price not available"
        );
      }
    };

    // Call updateTokenPrices initially
    updateTokenPrices();

    // Listen for changes in localStorage
    const onStorageChange = (event) => {
      if (event.key === "currentTokenPrices") {
        updateTokenPrices();
      }
    };
    window.addEventListener("storage", onStorageChange);

    return () => window.removeEventListener("storage", onStorageChange);
  }, [selectedCompany]);

  useEffect(() => {
    const handleTokenPriceUpdate = () => {
      const currentTokenPrices = JSON.parse(
        localStorage.getItem("currentTokenPrices")
      );
      if (currentTokenPrices && selectedCompany) {
        setTokenPrice(
          currentTokenPrices[selectedCompany.tokenAddress] ||
            "Price not available"
        );
      }
    };

    window.addEventListener("tokenPriceUpdated", handleTokenPriceUpdate);
    return () =>
      window.removeEventListener("tokenPriceUpdated", handleTokenPriceUpdate);
  }, [selectedCompany]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      alert("Please enter your phone number.");
      return;
    }

    try {
      const otpResponse = await fetch("http://localhost:5000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!otpResponse.ok) throw new Error("Failed to send OTP");

      setOtpSent(true);
      alert("OTP sent successfully! Please check your phone.");
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
      const verifyResponse = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      if (!verifyResponse.ok) throw new Error("Invalid OTP. Please try again.");

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
      const selectedTokenPrice = tokenPrice;
      if (!selectedTokenPrice) {
        alert("Token price not found for the selected token address.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const escrowContract = new ethers.Contract(
        escrowAddress,
        EscrowWallet.abi,
        signer
      );

      const depositTx = await escrowContract.deposit({
        value: ethers.utils.parseEther(amount),
      });
      await depositTx.wait();

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

      // Send transaction details as an SMS
      try {
        const smsResponse = await fetch(
          "http://localhost:5000/send-transaction-message",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phoneNumber, message: transactionDetails }),
          }
        );

        if (!smsResponse.ok) {
          throw new Error("Failed to send transaction details SMS");
        }
        console.log("Transaction details sent via SMS successfully!");
      } catch (error) {
        console.error("Error sending transaction details SMS:", error);
      }
      
      const investmentEntry = {
        company: selectedCompany.name,
        escrowAddress,
        amountDeposited: amount,
        tokensReceived: (amount / selectedTokenPrice).toFixed(0),
        tokenPrice: selectedTokenPrice,
      };

      const updatedInvestments = [...investments, investmentEntry];
      setInvestments(updatedInvestments);
      localStorage.setItem("investments", JSON.stringify(updatedInvestments));

      // Ensure currentTokenPrices is initialized as an object in localStorage
      let currentTokenPrices = JSON.parse(
        localStorage.getItem("currentTokenPrices") || "{}"
      );
      if (typeof currentTokenPrices !== "object") {
        currentTokenPrices = {};
      }

      // Update token price in currentTokenPrices
      console.log(selectedCompany.tokenAddress);
      let updatedPrice = await loadTokenPrice(selectedCompany.tokenAddress);
      console.log(updatedPrice);
      currentTokenPrices[selectedCompany.tokenAddress] = updatedPrice;
      localStorage.setItem(
        "currentTokenPrices",
        JSON.stringify(currentTokenPrices)
      );

      alert("Deposit successful!");
      setAmount("");
      setOtp("");
      setOtpSent(false);
      setTokenPrice("Select a Company");
      setSelectedCompany(null);
      setEscrowAddress("");
      setPhoneNumber("");
      setRefreshTokenPrices((prev) => !prev);
    } catch (error) {
      console.error(
        "Error during deposit or saving investment details:",
        error
      );
      alert(`An error occurred: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>ICO Dashboard</h1>
        <button className="connect-wallet">
          Connected Wallet: {account || "Connect"}
        </button>
        <button onClick={toggleModal} className="show-companies-button">
          View Registered Companies
        </button>
      </header>

      <div class="parent">
        <div class="left">
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
                <button
                  className="send-otp-button"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
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
                  <button
                    className="verify-otp-button"
                    onClick={handleVerifyOtp}
                  >
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
                      <p>
                        Bought At Token Price: {investment.tokenPrice} ETH/token
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No investments yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div class="right">
          <Balance />
          <EscrowBalance />
          <TokenPrices refresh={refreshTokenPrices} />
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
              className={`company-card ${
                selectedCompany === index ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedCompany(company);
                setEscrowAddress(company.escrowAddress);
                loadTokenPrice(company.tokenAddress);
                toggleModal();
              }}
            >
              <h3>{company.name}</h3>
              <p>
                <strong>Escrow Address:</strong> {company.escrowAddress}
              </p>
              <p>
                <strong>Token Address:</strong> {company.tokenAddress}
              </p>
            </div>
          ))}
        </div>
        <button className="close-modal-button" onClick={toggleModal}>
          Close
        </button>
      </Modal>
    </div>
  );
};

export default App;
