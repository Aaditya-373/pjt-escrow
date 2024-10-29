// export default App;
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import EscrowWallet from "./abis/EscrowWallet.json";
import DemandBasedToken from "./abis/DemandBasedToken.json";
import CompanyRegistry from "./abis/CompanyRegistry.json";
import "./App.css"; // Import your CSS file for styling
import Balance from "./Balance";
import Modal from "react-modal";
const { companyRegistryAddress } = require("./config"); // Import CompanyRegistry address
// Make sure you have this logo in your project

const App = () => {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [investments, setInvestments] = useState([]);
  const [escrowAddress, setEscrowAddress] = useState("");
  const [tokenPrice, setTokenPrice] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(false);

  useEffect(() => {
    const loadProvider = async () => {
      const { ethereum } = window;
      if (!ethereum) return;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    };

    const savedInvestments = localStorage.getItem("investments");
    if (savedInvestments) {
      setInvestments(JSON.parse(savedInvestments));
    }

    loadProvider();
    loadRegisteredCompanies();
  }, [tokenPrice]);

  const loadRegisteredCompanies = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const companyRegistry = new ethers.Contract(
        companyRegistryAddress,
        CompanyRegistry.abi,
        provider
      );

      // Try to call getRegisteredCompanies
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

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // const handleDeposit = async () => {
  //   if (
  //     !escrowAddress ||
  //     !tokenAddress ||
  //     !priceManagerAddress ||
  //     !amount ||
  //     !phoneNumber
  //   ) {
  //     alert("Please enter all required fields.");
  //     return;
  //   }

  //   // setLoading(true);
  //   try {
  //     // Send OTP
  //     // const otpResponse = await fetch('http://localhost:5000/send-otp', {
  //     //   method: 'POST',
  //     //   headers: { 'Content-Type': 'application/json' },
  //     //   body: JSON.stringify({ phoneNumber }),
  //     // });

  //     // if (!otpResponse.ok) throw new Error('Failed to send OTP');

  //     // setOtpSent(true);
  //     // alert('OTP sent successfully! Please check your phone.');
  //     // const enteredOtp = prompt("Please Enter your OTP:");
  //     // setOtp(enteredOtp);

  //     // if (otpSent) {
  //     //   // Verify OTP
  //     //   const verifyResponse = await fetch('http://localhost:5000/verify-otp', {
  //     //     method: 'POST',
  //     //     headers: { 'Content-Type': 'application/json' },
  //     //     body: JSON.stringify({ phoneNumber, otp: enteredOtp }),
  //     //   });

  //     //   if (!verifyResponse.ok) throw new Error('Invalid OTP. Please try again.');

  //     const provider = new ethers.providers.Web3Provider(window.ethereum);
  //     const signer = provider.getSigner();

  //     // Deposit transaction
  //     const escrowContract = new ethers.Contract(
  //       escrowAddress,
  //       EscrowWallet.abi,
  //       signer
  //     );
  //     const depositTx = await escrowContract.deposit({
  //       value: ethers.utils.parseEther(amount),
  //     });
  //     await depositTx.wait();
  //     console.log("Deposit transaction successful:", depositTx);

  //     const transactionDetails = `
  //         Transaction Hash: ${depositTx.hash}
  //         Senders: ${depositTx.from}
  //         Receivers: ${depositTx.to}
  //         Amount: ${amount} ETH
  //         Gas Used: ${depositTx.gasPrice.toString()}
  //         ChainID: ${depositTx.chainId}
  //         Block Number: ${depositTx.blockNumber}
  //         Nonce: ${depositTx.nonce}
  //       `;

  //     // await fetch('http://localhost:5000/send-transaction-message', {
  //     //   method: 'POST',
  //     //   headers: { 'Content-Type': 'application/json' },
  //     //   body: JSON.stringify({ phoneNumber, message: transactionDetails }),
  //     // });

  //     // Mint tokens
  //     // Mint tokens
  //     // const tokenContract = new ethers.Contract(
  //     //   tokenAddress,
  //     //   DemandBasedToken.abi,
  //     //   signer
  //     // );
  //     // const mintTx = await tokenContract
  //     //   .connect(signer)
  //     //   .mintTokens(account, ethers.utils.parseEther(amount)); // Correct

  //     // await mintTx.wait();
  //     // console.log("Mint transaction successful:", mintTx);

  //     // Update token price
  //     // const priceManagerContract = new ethers.Contract(
  //     //   priceManagerAddress,
  //     //   TokenPriceManager.abi,
  //     //   signer
  //     // );
  //     // console.log(priceManagerContract)
  //     // await priceManagerContract
  //     //   .connect(signer)
  //     //   .updatePriceOnDeposit(ethers.utils.parseEther(amount));
  //     // console.log("hi2")
  //     // await priceManagerContract.wait();
  //     // console.log("hi3")
  //     // const updatedPrice = await priceManagerContract.getTokenPrice();

  //     // setTokenPrice(updatedPrice);
  //     // console.log(updatedPrice);

  //     // const mintDetails = `
  //     //     Transaction Hash: ${mintTx.hash}
  //     //     Senders: ${mintTx.from}
  //     //     Receivers: ${mintTx.to}
  //     //     TokenPrice: ${tokenPrice} ETH
  //     //     Tokens: ${(amount * tokenPrice).toFixed(0)}
  //     //     Amount: ${amount} ETH
  //     //     Gas Used: ${mintTx.gasPrice.toString()}
  //     //     ChainID: ${mintTx.chainId}
  //     //     Block Number: ${mintTx.blockNumber}
  //     //     Nonce: ${mintTx.nonce}
  //     //   `;

  //     // await fetch('http://localhost:5000/send-transaction-message', {
  //     //   method: 'POST',
  //     //   headers: { 'Content-Type': 'application/json' },
  //     //   body: JSON.stringify({ phoneNumber, message: mintDetails }),
  //     // });

  //     // Add investment entry
  //     setInvestments([
  //       ...investments,
  //       {
  //         company: `Company ${investments.length + 1}`,
  //         escrowAddress,
  //         amountDeposited: amount,
  //         tokensReceived: (amount * tokenPrice).toFixed(0),
  //         tokenPrice: tokenPrice,
  //       },
  //     ]);

  //     // Reset form
  //     setAmount("");
  //     setOtp("");
  //     setOtpSent(false);
  //     alert("Deposit and minting successful!");

  //     // }
  //   } catch (error) {
  //     console.error("Error during deposit or token minting:", error);
  //     alert(
  //       `An error occurred during deposit or token minting: ${error.message}`
  //     );
  //   } finally {
  //     // setLoading(false);
  //   }
  // };
  const handleDeposit = async () => {
    if (!escrowAddress || !amount || !phoneNumber) {
        alert("Please enter all required fields.");
        return;
    }

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const escrowContract = new ethers.Contract(escrowAddress, EscrowWallet.abi, signer);

        const depositTx = await escrowContract.deposit({
            value: ethers.utils.parseEther(amount),
        });
        await depositTx.wait();
        console.log("Deposit transaction successful:", depositTx);

        setInvestments([
            ...investments,
            {
                company: `Company ${investments.length + 1}`,
                escrowAddress,
                amountDeposited: amount,
                tokensReceived: (amount * tokenPrice).toFixed(0),
                tokenPrice: tokenPrice,
            },
        ]);

        setAmount("");
        setOtp("");
        setOtpSent(false);
        alert("Deposit and minting successful!");

    } catch (error) {
        console.error("Error during deposit or token minting:", error);
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
      <div className="investment-form">
        <h2>Invest in a Company</h2>
        <input type="text" placeholder="Escrow Wallet Address" value={escrowAddress} onChange={(e) => setEscrowAddress(e.target.value)} />
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
            </div>
          ))}
        </div>
        <button onClick={toggleModal}>Close</button>
      </Modal>

    </div>
  </div>
);
};

export default App;
