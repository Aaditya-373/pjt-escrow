// src/App.js

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

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
    <div>
      <h1>MetaMask Balance Checker</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Account: {account}</p>
          <p>Balance: {balance} ETH</p>
        </div>
      )}
    </div>
  );
}

export default Balance;
