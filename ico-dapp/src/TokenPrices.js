// TokenPrices.js
import React, { useState, useEffect } from "react";

const TokenPrices = () => {
  const [tokenPrices, setTokenPrices] = useState({});

  useEffect(() => {
    const fetchTokenPrices = () => {
      const storedPrices = JSON.parse(localStorage.getItem("currentTokenPrices") || "{}");
      setTokenPrices(storedPrices);
    };

    fetchTokenPrices();

    // Listen for changes in localStorage
    const onStorageChange = () => fetchTokenPrices();
    window.addEventListener("storage", onStorageChange);

    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  return (
    <div>
      <h3>Token Prices</h3>
      <table>
        <thead>
          <tr>
            <th>Token Address</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(tokenPrices).map(([address, price]) => (
            <tr key={address}>
              <td>{address}</td>
              <td>{price} ETH</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenPrices;
