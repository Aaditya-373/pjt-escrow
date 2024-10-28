// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0x01d8c4b1e28b3f5147610785829875b083ad28559302709daff1193e0f864cc1"] // Private key of your Ganache account
    }
  }
};
