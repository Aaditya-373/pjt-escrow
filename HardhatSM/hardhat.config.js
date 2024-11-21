// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0x43ee422e2c37fa57b56cad7564e7d7289f28e3ba45c1dc46ccd7ead0eedbe0ea"] // Private key of your Ganache account
    }
  }
};
