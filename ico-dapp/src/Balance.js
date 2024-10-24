// src/Balance.js

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './Balance.css'; // Import the new CSS styles

function Balance() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting to wallet: ", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Function to fetch the balance
  const fetchBalance = async () => {
    if (account) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balanceInWei = await provider.getBalance(account);
      const balanceInEth = ethers.utils.formatEther(balanceInWei);
      setBalance(balanceInEth);
      setLoading(false);
    }
  };

  // Automatically connect to MetaMask on page load
  useEffect(() => {
    const initialize = async () => {
      await connectWallet(); // Attempt to connect wallet
    };

    initialize();
  }, []);

  useEffect(() => {
    if (account) {
      fetchBalance();
    }
  }, [account]);

  return (
    <div className="balance-container">
      <div className="balance-card">
        <h2>MetaMask Balance Checker</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <p className="account">Account: <span>{account}</span></p>
            <p className="balance">Balance: <span>{balance} ETH</span></p>
          </>
        )}
      </div>
    </div>
  );
}

export default Balance;
