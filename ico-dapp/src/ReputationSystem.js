import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import CompanyRegistry from "./abis/CompanyRegistry.json";
import { companyRegistryAddress } from "./config";

const ReputationSystem = () => {
    const [companies, setCompanies] = useState([]);

    const loadReputationScores = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const companyRegistry = new ethers.Contract(
                companyRegistryAddress,
                CompanyRegistry.abi,
                provider
            );

            const companies = await companyRegistry.getCompaniesByReputation();

            const formattedCompanies = companies.map((company) => ({
                name: company.name,
                escrowAddress: company.escrowAddress,
                reputationScore: ethers.BigNumber.from(company.reputationScore).toString(),
            }));
            setCompanies(formattedCompanies);
        } catch (error) {
            console.error("Error loading reputation scores:", error);
        }
    };

    useEffect(() => {
        loadReputationScores();
    });


    return (
        <div style={{ backgroundColor: "#1e1e1e", padding: "20px" }}>
            <h2 style={{ color: "white" }}>Company Reputation Scores</h2>
            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                    maxHeight: "400px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    backgroundColor: "#333",
                    paddingRight: "10px",
                }}
            >
                {companies.map((company, index) => (
                    <li
                        key={index}
                        style={{
                            color: "white",
                            marginBottom: "10px",
                            padding: "10px",
                            backgroundColor: "#444",
                            borderRadius: "8px",
                        }}
                    >
                        <span style={{ fontWeight: "bold" }}>{company.name}:</span>
                        <span style={{ color: "rgb(9, 205, 9)", marginLeft: "8px" }}>
                            {company.reputationScore}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );

};

export default ReputationSystem;
