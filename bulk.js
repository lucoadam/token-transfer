const { configDotenv } = require("dotenv");
const { ethers } = require("ethers");
const fs = require("fs");
const {
  abi: TokenTransferModuleABI,
} = require("./ignition/deployments/TokenTransfer/artifacts/TokenTranferModule#TokenTransfer.json");
const {
  "TokenTranferModule#TokenTransfer": TokenTransferModuleAddress,
} = require("./ignition/deployments/TokenTransfer/deployed_addresses.json");

const BigNumber = require("bignumber.js");

configDotenv();
const { TOKEN_ADDRESS, PRIVATE_KEY, EVM_RPC_URL } = process.env;
const configs = {
  tokenAddress: TOKEN_ADDRESS,
  privateKey: PRIVATE_KEY,
  rpc: EVM_RPC_URL,
};

let wallets = fs
  .readFileSync("wallets.csv", "utf8")
  .split("\n")
  .map((line) => {
    const [address, amount] = line.split(",");
    return {
      address,
      amount,
    };
  })
  .slice(1)
  .filter((wallet) => wallet.address && wallet.amount);
console.log("TotalWallets:", wallets.length);
const provider = new ethers.JsonRpcProvider(configs.rpc);

const wallet = new ethers.Wallet(configs.privateKey, provider);

const tokenABI = [
  "function transfer(address recipient, uint256 amount) public returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
];

// The token you want to send
const tokenContract = new ethers.Contract(
  configs.tokenAddress,
  tokenABI,
  wallet
);

// The contract that will batch transfer the tokens
const batchTransferContract = new ethers.Contract(
  TokenTransferModuleAddress,
  TokenTransferModuleABI,
  wallet
);

const failed = [];
const succcess = [];

const sendTokens = async () => {
  let gasPrice = await (await provider.getFeeData()).gasPrice;
  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("Fetching token decimals");
  const decimal = await tokenContract.decimals();
  console.log("Token Decimals:", decimal);

  wallets = wallets.map((wallet) => ({
    ...wallet,
    amount: ethers.parseUnits(wallet.amount, Number(decimal)),
  }));

  const isAllSameAmount = wallets.every(
    (wallet) => wallet.amount === wallets[0].amount
  );
  const totalAmounts = wallets.reduce(
    (acc, wallet) => acc.plus(wallet.amount.toString()),
    new BigNumber(0)
  );

  console.log(
    "Total Amounts:",
    ethers.formatUnits(totalAmounts.toFixed(), Number(decimal))
  );
  console.log("Approving contract to spend tokens");
  let tx = await tokenContract.approve(
    TokenTransferModuleAddress,
    totalAmounts.toFixed()
  );
  await tx.wait();
  console.log("Approved success");

  while (true) {
    // slice 500 wallets
    const recipients = wallets.splice(0, 500);
    if (recipients.length === 0) {
      break;
    }
    try {
      const receivingAmounts = recipients.map((wallet) => wallet.amount);
      const receivingAddresses = recipients.map((wallet) => wallet.address);
      // gas price in gwei
      gasPrice = await (await provider.getFeeData()).gasPrice;
      console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"));
      if (isAllSameAmount) {
        tx = await batchTransferContract.transferSingleValue(
          configs.tokenAddress,
          receivingAddresses,
          receivingAmounts[0]
        );
        await tx.wait();
      } else {
        tx = await batchTransferContract.transferBatchValue(
          configs.tokenAddress,
          receivingAddresses,
          receivingAmounts
        );
        await tx.wait();
      }
      console.log("Sent success to:", recipients.length, "wallets");
      recipients.forEach((wallet) => {
        succcess.push({
          address: wallet.address,
          amount: wallet.amount,
          hash: tx.hash,
        });
      });
    } catch (error) {
      console.log(error);
      // if failed add to failed list
      recipients.forEach((wallet) => {
        failed.push({
          address: wallet.address,
          amount: wallet.amount,
        });
      });
    }
    // write failed list to file with name failed.csv
    const failedCSV = failed
      .map(
        (wallet) =>
          `${wallet.address},${ethers.formatUnits(
            wallet.amount,
            Number(decimal)
          )}`
      )
      .join("\n");
    const successCSV = succcess
      .map(
        (wallet) =>
          `${wallet.address},${ethers.formatUnits(
            wallet.amount,
            Number(decimal)
          )},${wallet.hash}`
      )
      .join("\n");

    fs.writeFileSync("out/success.csv", "Address,Amount,Hash\n" + successCSV);
    fs.writeFileSync("out/failed.csv", "Address,Amount\n" + failedCSV);
  }
};

sendTokens()
  .then(() => console.log("Finished"))
  .catch((error) => console.log(error.stack || error.message));
