// TokenPrices.js
import React, { useEffect, useState } from 'react';
import './TokenPrices.css';

const TokenPrices = () => {
    const [tokenPrices, setTokenPrices] = useState([]);

    useEffect(() => {
        // Replace this with your API or logic to fetch token prices
        const fetchTokenPrices = async () => {
            const prices = [
                { token: 'Token A', price: '0.005 ETH' },
                { token: 'Token B', price: '0.010 ETH' },
                { token: 'Token C', price: '0.020 ETH' },
            ];
            setTokenPrices(prices);
        };

        fetchTokenPrices();
    }, []);

    return (
        <div className="token-prices-container">
            <h2 className="token-prices-title">Token Prices</h2>
            <div className="token-prices-list">
                {tokenPrices.map((price, index) => (
                    <div key={index} className="token-price-item">
                        <span className="token-name">{price.token}</span>
                        <span className="token-price">{price.price}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TokenPrices;
