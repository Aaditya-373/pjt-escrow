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
import ReputationSystem from "./ReputationSystem";

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
  const [withdrawalMode, setWithdrawalMode] = useState(""); // State to store the selected withdrawal mode
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawalInProgress, setWithdrawalInProgress] = useState({});
  const [withdrawalStatus, setWithdrawalStatus] = useState({});

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

  const toggleWModal = () => {
    setIsWithdrawModalOpen(!isWithdrawModalOpen);
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
        tokenAddress: selectedCompany.tokenAddress,
        tokensReceived: (amount / selectedTokenPrice).toFixed(0),
        tokenPrice: selectedTokenPrice,
      };

      const updatedInvestments = [...investments, investmentEntry];
      setInvestments(updatedInvestments);
      localStorage.setItem("investments", JSON.stringify(updatedInvestments));

     
      let currentTokenPrices = JSON.parse(
        localStorage.getItem("currentTokenPrices") || "{}"
      );
      if (typeof currentTokenPrices !== "object") {
        currentTokenPrices = {};
      }

      let updatedPrice = await loadTokenPrice(selectedCompany.tokenAddress);
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

  const handleWithdrawal = async (
    modeOfWithdrawal,
    escrowAddress,
    totalAmount,
    tokenAddress,
  ) => {
    if (!escrowAddress || !modeOfWithdrawal) {
      alert("Please select a withdrawal mode and provide an escrow address.");
      return;
    }

    // Set the withdrawal status to "in progress" with the start time
    setWithdrawalStatus((prevStatus) => ({
      ...prevStatus,
      [escrowAddress]: {
        status: "Withdrawal in progress...",
        startTime: Date.now(), // Store the start time in milliseconds
        type: modeOfWithdrawal, // Store the type of withdrawal
      },
    }));

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const escrowContract = new ethers.Contract(
        escrowAddress,
        EscrowWallet.abi,
        signer
      );

      let tx;
      // if (modeOfWithdrawal === "Immediate") {
      //   tx = await escrowContract.immediateWithdrawal(account);
      // } else if (modeOfWithdrawal === "Paced") {
      //   tx = await escrowContract.pacedWithdrawal(account);
      // } else if (modeOfWithdrawal === "Full") {
      //   tx = await escrowContract.fullWithdrawal(account);
      // } else {
      //   throw new Error("Invalid withdrawal mode selected.");
      // }
      if (modeOfWithdrawal === "Immediate") {
        tx = await escrowContract.immediateWithdrawal(account);
      } else if (modeOfWithdrawal === "Paced") {
        let cnt = 3;
        let interval = 24 * 60 * 30000; // 30 seconds in milliseconds
        for (let i = 0; i < cnt; i++) {
          setTimeout(async () => {
            try {
              tx = await escrowContract.pacedWithdrawal(account);
              console.log(`Paced withdrawal #${i + 1} successful`);
            } catch (error) {
              if (
                error.message.includes("Cannot read properties of") ||
                error.message.includes("Internal JSON-RPC error")
              ) {
                alert(
                  "You are not allowed to withdraw at this time. Please check your withdrawal conditions."
                );
              } else if (error.message.includes("insufficient funds")) {
                alert("Insufficient funds for this withdrawal.");
              } else {
                console.error(
                  `Error during paced withdrawal #${i + 1}:`,
                  error
                );
              }
            }
          }, interval * i); // Delay each call by interval * i (30s, 60s, 90s)
        }
      } else if (modeOfWithdrawal === "Full") {
        let cnt = 3;
        let interval = 30000 * 24 * 60;
        for (let i = 0; i < cnt; i++) {
          setTimeout(async () => {
            try {
              tx = await escrowContract.fullWithdrawal(account);
              console.log(`Full withdrawal #${i + 1} successful`);
            } catch (error) {
              console.error(`Error during full withdrawal #${i + 1}:`, error);
            }
          }, interval * i); // Delay each call by interval * i (30s, 60s, 90s)
        }
      } else {
        throw new Error("Invalid withdrawal mode selected.");
      }

      await tx.wait(); // Wait for the transaction to complete

    
      alert(
        `Withdrawal (${modeOfWithdrawal}) successful! Transaction: ${tx.hash}`
      );

      // Reset status after the withdrawal is complete
      let currentTokenPrices = JSON.parse(
        localStorage.getItem("currentTokenPrices") || "{}"
      );

      if (typeof currentTokenPrices !== "object") {
        currentTokenPrices = {};
      }
      console.log(selectedCompany);
      let updatedPrice = await loadTokenPrice(tokenAddress);
      currentTokenPrices[selectedCompany.tokenAddress] = updatedPrice;
      localStorage.setItem(
        "currentTokenPrices",
        JSON.stringify(currentTokenPrices)
      );


      setWithdrawalStatus((prevStatus) => ({
        ...prevStatus,
        [escrowAddress]: {
          status: "Withdrawal completed",
          startTime: prevStatus[escrowAddress]?.startTime, // Retain the start time
          type: modeOfWithdrawal, // Retain withdrawal type
        },
      }));

      toggleWModal();
    } catch (error) {
      // Catch specific errors and provide a user-friendly alert
      if (error.message.includes("Internal JSON-RPC error")) {
        alert(
          "You are not allowed to withdraw at this time. Please check your withdrawal conditions."
        );
      } else if (error.message.includes("insufficient funds")) {
        alert("Insufficient funds for this withdrawal.");
      } else if (error.message.includes("Cannot read properties of")) {
        alert("Please wait.Processing...");
      } else {
        alert(`An error occurred during withdrawal: ${error.message}`);
      }
      console.error("Error during withdrawal:", error);
      setWithdrawalStatus((prevStatus) => ({
        ...prevStatus,
        [escrowAddress]: {
          status: "Transaction on Cooldown",
          startTime: prevStatus[escrowAddress]?.startTime,
          type: modeOfWithdrawal,
        },
      }));
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      // Update the status every second (or other intervals) to check how long it's been
      setWithdrawalStatus((prevStatus) => {
        const updatedStatus = { ...prevStatus };

        Object.keys(prevStatus).forEach((escrowAddress) => {
          const status = prevStatus[escrowAddress];
          const elapsed = Date.now() - status.startTime; // Time passed in milliseconds

          if (status.status === "Withdrawal in progress...") {
            // Depending on the withdrawal type, adjust the duration
            if (status.type === "Immediate" && elapsed >= 0) {
              updatedStatus[escrowAddress].status = "Withdrawal completed";
            } else if (
              status.type === "Paced" &&
              elapsed >= 24 * 60 * 60 * 1000
            ) {
              updatedStatus[escrowAddress].status = "Withdrawal completed";
            } else if (
              status.type === "Full" &&
              elapsed >= 48 * 60 * 60 * 1000
            ) {
              updatedStatus[escrowAddress].status = "Withdrawal completed";
            }
          }
        });

        return updatedStatus;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval); // Clean up the interval when component is unmounted
  }, []);

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
                    <div
                      className="investment-card"
                      key={index}
                      onClick={() => {
                        setSelectedCompany(investment);
                        toggleWModal();
                      }}
                    >
                      <h4>{investment.company}</h4>
                      <p>Escrow Wallet Address: {investment.escrowAddress}</p>
                      <p>Amount Deposited: {investment.amountDeposited} ETH</p>
                      <p>Tokens Received: {investment.tokensReceived}</p>
                      <p>
                        Bought At Token Price: {investment.tokenPrice} ETH/token
                      </p>
                      {withdrawalStatus[investment.escrowAddress] && (
                        <p style={{ color: "orange" }}>
                          {withdrawalStatus[investment.escrowAddress].status}
                        </p>
                      )}
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
          <ReputationSystem />
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

      <Modal
        isOpen={isWithdrawModalOpen}
        onRequestClose={toggleWModal}
        className="company-modal"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <h2>Investment Details</h2>
        {selectedCompany && (
          <>
            <p>Company: {selectedCompany.company}</p>
            <p>Escrow Wallet Address: {selectedCompany.escrowAddress}</p>
            <p>Amount Deposited: {selectedCompany.amountDeposited} ETH</p>
            <p>Tokens Received: {selectedCompany.tokensReceived}</p>
            <p>Bought At Token Price: {selectedCompany.tokenPrice} ETH/token</p>

            <div>
              <h3>Select Withdrawal Mode</h3>
              <label>
                <input
                  type="radio"
                  value="Immediate"
                  checked={withdrawalMode === "Immediate"}
                  onChange={() => setWithdrawalMode("Immediate")}
                />
                Immediate
              </label>
              <label>
                <input
                  type="radio"
                  value="Paced"
                  checked={withdrawalMode === "Paced"}
                  onChange={() => setWithdrawalMode("Paced")}
                />
                Paced
              </label>
              <label>
                <input
                  type="radio"
                  value="Full"
                  checked={withdrawalMode === "Full"}
                  onChange={() => setWithdrawalMode("Full")}
                />
                Full
              </label>
            </div>

            <button
              onClick={() =>
                handleWithdrawal(
                  withdrawalMode,
                  selectedCompany.escrowAddress,
                  selectedCompany.amountDeposited,
                  selectedCompany.tokenAddress
                )
              }
              disabled={!withdrawalMode}
              style={{ marginRight: "5px" }}
            >
              Withdraw
            </button>
          </>
        )}

        <button className="close-modal-button" onClick={toggleWModal}>
          Close
        </button>
      </Modal>
    </div>
  );
};

export default App;
