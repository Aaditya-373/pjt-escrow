const fs = require('fs');
const path = require('path');

// Path to the config file
const configFilePath = path.join(__dirname, 'config.json');

// Function to read the config file
function readConfig() {
  try {
    const data = fs.readFileSync(configFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading config file:', err);
    return null;
  }
}

// Function to write the updated config data to the file
function writeConfig(config) {
  try {
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(configFilePath, data, 'utf8');
  } catch (err) {
    console.error('Error writing config file:', err);
  }
}

// Update the companyRegistryAddress
function updateCompanyRegistryAddress(newAddress) {
  const config = readConfig();
  if (config) {
    config.companyRegistryAddress = newAddress;
    writeConfig(config);
  }
}

// Update the reputationSystemAddress
function updateReputationSystemAddress(newAddress) {
  const config = readConfig();
  if (config) {
    config.reputationSystemAddress = newAddress;
    writeConfig(config);
  }
}

// Append a new company with details
function appendCompany(companyName, companyDetails) {
  const config = readConfig();
  if (config) {
    if (!config.companyAccountAddress[companyName]) {
      config.companyAccountAddress[companyName] = {
        account: companyDetails.account || "0",
        token : companyDetails.token,
        escrows: companyDetails.escrows || {}
      };
      writeConfig(config);
    } else {
      console.log(`Company ${companyName} already exists.`);
    }
  }
}

// Append an escrow for a given company
function appendEscrowToCompany(companyName, escrowId, escrowAddress) {
  const config = readConfig();
  if (config && config.companyAccountAddress[companyName]) {
    config.companyAccountAddress[companyName].escrows[`${escrowId}`] = escrowAddress;
    writeConfig(config);
  } else {
    console.log(`Company ${companyName} not found.`);
  }
}

// Update the account value for a given company
function updateCompanyAccountValue(companyName, newAccountValue) {
  const config = readConfig();
  if (config && config.companyAccountAddress[companyName]) {
    config.companyAccountAddress[companyName].account = newAccountValue;
    writeConfig(config);
  } else {
    console.log(`Company ${companyName} not found.`);
  }
}

// Check if a company exists
function companyExists(companyName) {
  const config = readConfig();
  return config && config.companyAccountAddress[companyName] ? true : false;
}

// Get company account
function getCompanyAccount(companyName) {
  const config = readConfig();
  if (config && config.companyAccountAddress[companyName]) {
    return config.companyAccountAddress[companyName].account;
  }
  console.log(`Company ${companyName} not found.`);
  return null;
}
function getCompanyToken(companyName) {
  const config = readConfig();
  if (config && config.companyAccountAddress[companyName]) {
    return config.companyAccountAddress[companyName].token;
  }
  console.log(`Company ${companyName} not found.`);
  return null;
}

// Export the functions
module.exports = {
  updateCompanyRegistryAddress,
  updateReputationSystemAddress,
  appendCompany,
  appendEscrowToCompany,
  updateCompanyAccountValue,
  companyExists,
  getCompanyAccount,
  getCompanyToken
};
