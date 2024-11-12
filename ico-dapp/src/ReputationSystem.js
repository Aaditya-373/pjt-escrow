// CompanyReputationList.js
'use client'

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import CompanyRegistryJson from "./abis/CompanyRegistry.json"; // Update with the path to your ABI file
const { companyRegistryAddress } = require("./config.json");

const ReputationSystem = () => {
  const [companies, setCompanies] = useState([]);
  const CompanyRegistryABI = CompanyRegistryJson.abi;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          companyRegistryAddress,
          CompanyRegistryABI,
          provider
        );

        const registeredCompanies = await contract.getRegisteredCompanies();
        const companyData = await Promise.all(
          registeredCompanies.map(async (escrowAddress) => {
            const [name, , , , reputation] = await contract.getCompanyDetails(escrowAddress);
            return { name, reputation: reputation.toString() }; // Convert BigNumber to string
          })
        );

        setCompanies(companyData);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div style={{ backgroundColor: "#1e1e1e", padding: "20px" }}>
      <h2 style={{ color: "white" }}>Company Reputation Scores</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {companies.map((company, index) => (
          <li
            key={index}
            style={{
              color: "white",
              marginBottom: "10px",
              padding: "10px",
              backgroundColor: "#333",
              borderRadius: "8px"
            }}
          >
            <span style={{ fontWeight: "bold" }}>{company.name}:</span>
            <span style={{ color: "rgb(9, 205, 9)", marginLeft: "8px" }}>
              {company.reputation}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReputationSystem;
