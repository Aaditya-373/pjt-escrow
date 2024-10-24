// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0x039ad63c0636684ac76b6ea650c1b42738e02bcade60bb588daf925c5fc915ff"] // Private key of your Ganache account
    }
  }
};
