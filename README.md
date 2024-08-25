### Transfer tokens from csv file

This reads a csv file `wallets.csv` with the following format:
```
Address,Amount
0x1234,100
0x5678,200
```

And sends the specified amount of tokens to the specified address.

### Environment variables

File for the environment variables is `.env`
- `PRIVATE_KEY` - The private key of the account that will send the tokens
- `TOKEN_ADDRESS` - The address of the token contract
- `EVM_RPC_URL` - The RPC URL of the network

### Usage 1
Transfer one by one without external contract. Suitable if you have less than 25 wallets to transfer.
```bash
yarn install

yarn start
```

### Usage 2
Transfer in bulk (500 at a time) with deploying external contract. Comperatively it is faster and cheaper for more than 25 wallets.
```bash
yarn install

yarn deploy

yarn start-bulk
```
