# Contributing

## Developers

### Getting started

0. Clone/fork this repo:

   ```bash
   git clone https://github.com/proof-Of-Humanity/proof-Of-Humanity-web/
   ```

1. Install the dependencies:

    ```bash
    npm install
    ```

2. Copy the `.env.example` file into `.env.local` and set the appropriate values:

   ```bash
   cp .env.example .env.local
   ```

   ```bash
   NEXT_PUBLIC_INFURA_API_KEY='YOUR API KEY'
   NEXT_PUBLIC_IPFS_GATEWAY='https://ipfs.kleros.io'
   ```

3. Build the subgraph and the relay schemas locally:

   ```bash
   npm run build:graph:{network}
   npm run dev:relay:{network}
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   ℹ️ If you are running version 17 of Node and are getting an `ERR_OSSL_EVP_UNSUPPORTED` error, use this [workaround](https://github.com/webpack/webpack/issues/14532#issuecomment-947012063):
   
   ```bash
   export NODE_OPTIONS=--openssl-legacy-provider
   ```

### Pull requests

After making your changes, you can open a pull request and ask for review.
