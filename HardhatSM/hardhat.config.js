// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0xa188ce22ae0699196f9cceb6421a66478cce9f7faab2905f2263d86bb1865563", "0xa188ce22ae0699196f9cceb6421a66478cce9f7faab2905f2263d86bb1865563",] // Private key of your Ganache account
    }
  }
};
