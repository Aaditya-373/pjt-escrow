import React, { useState, useEffect } from "react";
import "./Tp.css"
const TokenPrices = ({ refresh }) => {
  const [tokenPrices, setTokenPrices] = useState({});

  useEffect(() => {
    const fetchTokenPrices = () => {
      const storedPrices = JSON.parse(localStorage.getItem("currentTokenPrices"));
      setTokenPrices(storedPrices || {});
    };

    fetchTokenPrices();

    const onStorageChange = (event) => {
      if (event.key === "currentTokenPrices") {
        fetchTokenPrices();
        window.dispatchEvent(new Event("tokenPriceUpdated"));
      }
    };
    window.addEventListener("storage", onStorageChange);

    return () => window.removeEventListener("storage", onStorageChange);
  }, [refresh]);

  return (
    <div className="token-prices-container">
      <h3 className="token-prices-header">Invested Token Prices</h3>
      <table className="token-prices-table">
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
