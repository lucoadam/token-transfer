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

### Usage

```bash
yarn install

yarn start
```
