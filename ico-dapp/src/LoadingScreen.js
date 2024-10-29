// LoadingScreen.js
import React from 'react';
import metamaskLogo from './metamask-icon.webp'; // Ensure the logo is in the correct path
import './LoadingScreen.css';

const LoadingScreen = () => (
    <div className="loading-screen">
        <img src={metamaskLogo} alt="MetaMask Logo" className="metamask-logo" />
        <p>Connecting to MetaMask...</p>
        <div className="loading-animation"></div>
    </div>
);

export default LoadingScreen;
