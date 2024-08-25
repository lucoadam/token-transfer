const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TokenTranferModule", (m) => {
  const tokenTransfer = m.contract("TokenTransfer");

  return { tokenTransfer };
});
