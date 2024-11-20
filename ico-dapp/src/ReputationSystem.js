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
    }, []);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Company Reputation Scores</h2>
            <ul style={styles.list}>
                {companies.map((company, index) => (
                    <li key={index} style={styles.listItem}>
                        <span style={styles.companyName}>{company.name}</span>
                        <span style={styles.reputationScore}>
                            {company.reputationScore}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: "#1e1e1e",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
        maxWidth: "600px",
        margin: "20px auto",
    },
    title: {
        color: "#bb86fc",
        fontSize: "24px",
        marginBottom: "20px",
        textAlign: "center",
    },
    list: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        maxHeight: "400px",
        overflowY: "auto",
        borderRadius: "8px",
    },
    listItem: {
        color: "#e0e0e0",
        marginBottom: "10px",
        padding: "15px",
        backgroundColor: "#2a2a2a",
        borderRadius: "8px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.4)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    companyName: {
        fontWeight: "600",
        fontSize: "16px",
        color: "#ffffff",
    },
    reputationScore: {
        color: "rgb(9, 205, 9)",
        fontWeight: "bold",
    },
};

export default ReputationSystem;
