// src/Balance.js

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './Balance.css';

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
      await connectWallet();
    };
    initialize();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setLoading(true); // Show loading while fetching new balance
        } else {
          setAccount(null);
          setBalance(null);
        }
      });

      // Optional: listen for chain changes
      window.ethereum.on('chainChanged', () => {
        setLoading(true);
        connectWallet(); // Reconnect and fetch balance
      });
    }

    // Cleanup listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', connectWallet);
        window.ethereum.removeListener('chainChanged', connectWallet);
      }
    };
  }, []);

  // Fetch balance whenever the account updates
  useEffect(() => {
    if (account) {
      fetchBalance();

      // Polling for balance updates every 10 seconds (optional)
      const interval = setInterval(fetchBalance, 10000);

      // Clear the interval on component unmount or when account changes
      return () => clearInterval(interval);
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
