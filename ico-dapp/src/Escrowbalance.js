import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import EscrowWallet from "./abis/EscrowWallet.json";
import CompanyRegistry from "./abis/CompanyRegistry.json";
import "./Tp.css"; // Assuming you have some CSS for styling

const { companyRegistryAddress } = require("./config");

const EscrowBalances = () => {
  const [balances, setBalances] = useState([]);
  const [companies, setCompanies] = useState([]);

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

  const loadEscrowBalances = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      const escrowBalances = await Promise.all(
        companies.map(async (company) => {
          const escrowContract = new ethers.Contract(
            company.escrowAddress,
            EscrowWallet.abi,
            provider
          );
          const balance = await escrowContract.getBalance();
          
          return {
            escrowAddress: company.escrowAddress,
            balance: ethers.utils.formatEther(balance),
          };
        })
      );

      setBalances(escrowBalances);
    } catch (error) {
      console.error("Error loading escrow balances:", error);
      alert("Error loading escrow balances. Please check the console for details.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadRegisteredCompanies();
      await loadEscrowBalances();
    };
    loadData();

    const onBalanceChange = () => loadEscrowBalances();
    window.addEventListener("storage", onBalanceChange);

    return () => window.removeEventListener("storage", onBalanceChange);
  }, [companies]);

  return (
    <div className="token-prices-container">
      <h3 className="token-prices-header">Escrow Wallet Balances</h3>
      <table className="token-prices-table">
        <thead>
          <tr>
            <th>Escrow Address</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
        {balances.map((escrow, index) => (
          <tr key={index}>
            <td>{escrow.escrowAddress}</td>
            <td>{escrow.balance} ETH</td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};

export default EscrowBalances;
