const fs = require('fs');
const path = require('path');

// Define source and destination paths
const sourceDir = path.join(__dirname, 'HardhatSM', 'artifacts', 'contracts');
const destDirAbis = path.join(__dirname, 'ico-dapp', 'src', 'abis');
const sourceConfig = path.join(__dirname, 'HardhatSM', 'config.js');
const destConfig = path.join(__dirname, 'ico-dapp', 'src', 'config.js');

// Files to copy from HardhatSM/artifacts/contracts to ico-dapp/src/abis
const filesToCopy = [
  'CompanyRegistry.sol/CompanyRegistry.json',
  'DemandBasedToken.sol/DemandBasedToken.json',
  'Escrow.sol/EscrowWallet.json',
];

// Function to copy a file
function copyFile(src, dest) {
  fs.copyFile(src, dest, (err) => {
    if (err) {
      console.error(`Error copying file from ${src} to ${dest}:`, err);
    } else {
      console.log(`File copied from ${src} to ${dest}`);
    }
  });
}

// Function to copy all ABI files
function copyAbis() {
  filesToCopy.forEach((file) => {
    const sourceFilePath = path.join(sourceDir, file);
    const destFilePath = path.join(destDirAbis, path.basename(file));

    // Check if the destination folder exists, create it if not
    if (!fs.existsSync(destDirAbis)) {
      fs.mkdirSync(destDirAbis, { recursive: true });
    }

    // Copy the ABI files
    copyFile(sourceFilePath, destFilePath);
  });
}

// Function to copy the config file (overwrite it)
function copyConfig() {
  fs.copyFile(sourceConfig, destConfig, (err) => {
    if (err) {
      console.error(`Error copying config file:`, err);
    } else {
      console.log(`Config file copied and overwritten at ${destConfig}`);
    }
  });
}

// Start the copy process
copyAbis();
copyConfig();
