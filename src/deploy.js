const hardhat = require("hardhat");
const tokenTransferModule = require("./../ignition/modules/TokenTransfer.js");

const main = async () => {
  console.log("Deploying...");
  // compile contract
  const { tokenTransfer } = await hardhat.ignition.deploy(tokenTransferModule);
  // deploy contract
  console.log("Deployed:", tokenTransfer);
};

main();
