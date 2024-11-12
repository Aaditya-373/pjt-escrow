// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0x4f0bc7beaacc9383970f70b73e8c39c9882a80177b4065b6c23807962455b99e"] // Private key of your Ganache account
    }
  }
};
