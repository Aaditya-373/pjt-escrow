// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0x082b36eb16823bae1f0dbb705abc48d6664a7f04c141085ca2af3ff18923dcaa"] // Private key of your Ganache account
    }
  }
};
