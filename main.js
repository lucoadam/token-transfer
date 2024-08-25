const { configDotenv } = require("dotenv");
const { ethers } = require("ethers");
const fs = require("fs");

configDotenv();
const { TOKEN_ADDRESS, PRIVATE_KEY, EVM_RPC_URL } = process.env;
const configs = {
  tokenAddress: TOKEN_ADDRESS,
  privateKey: PRIVATE_KEY,
  rpc: EVM_RPC_URL,
};

const wallets = fs
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
const provider = new ethers.providers.JsonRpcProvider(configs.rpc);

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

// Recipients and amounts
const recipients = wallets.map((wallet) => wallet.address);
const failed = [];
const succcess = [];

const sendTokens = async () => {
  let gasPrice = await provider.getGasPrice();
  console.log("Gas Price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("Fetching token decimals");
  const decimal = await tokenContract.decimals();
  console.log("Token Decimals:", decimal);
  const receivingAmounts = wallets.map((wallet) =>
    ethers.utils.parseUnits(wallet.amount, Number(decimal))
  );
  for (let i = 0; i < recipients.length; i++) {
    try {
      // gas price in gwei
      gasPrice = await provider.getGasPrice();
      console.log("Gas Price:", ethers.utils.formatUnits(gasPrice, "gwei"));
      const tx = await tokenContract.transfer(
        recipients[i],
        receivingAmounts[i],
        {
          gasPrice,
        }
      );
      await tx.wait();
      console.log(
        "Sent success to:",
        recipients[i],
        "at index:",
        i + 1,
        "of",
        recipients.length
      );
      succcess.push({
        address: recipients[i],
        amount: receivingAmounts[i],
        hash: tx.hash,
      });
    } catch (error) {
      console.log(error);
      // if failed add to failed list
      failed.push({
        address: recipients[i],
        amount: receivingAmounts[i],
      });
    }

    // write failed list to file with name failed.csv
    const failedCSV = failed
      .map(
        (wallet) =>
          `${wallet.address},${ethers.utils.formatUnits(
            wallet.amount,
            Number(decimal)
          )}`
      )
      .join("\n");
    const successCSV = succcess
      .map(
        (wallet) =>
          `${wallet.address},${ethers.utils.formatUnits(
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
