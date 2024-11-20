// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0x8ffe47017b8098ce27eccdd7d0f6141c2a2ceddbc33f174ddc4a2bb47b692ff4"] // Private key of your Ganache account
    }
  }
};
