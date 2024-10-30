// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",  // Ganache network URL
      accounts: ["0x91164cbcc1eeab831704f3932fa4bbc20a25d35b54ffa426a58633242dd3230f"] // Private key of your Ganache account
    }
  }
};
