// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0x339723fc38e919399667e9eb3a77293b80286518fe87c97829d45e7f6026e623"] // Private key of your Ganache account
    }
  }
};
