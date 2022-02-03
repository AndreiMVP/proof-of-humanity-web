import Web3 from "web3";

import { ChainId, ChainKey, ChainName } from "./enums";

export const CHAIN_KEY = {
  [ChainId.ETHEREUM]: ChainKey.ETHEREUM,
  [ChainId.KOVAN]: ChainKey.KOVAN,
  [ChainId.XDAI]: ChainKey.XDAI,
};

export const CHAIN_NAME = {
  [ChainId.ETHEREUM]: ChainName.ETHEREUM,
  [ChainId.KOVAN]: ChainName.KOVAN,
  [ChainId.XDAI]: ChainName.XDAI,
};

export const CHAIN_RPC = {
  [ChainId.ETHEREUM]: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
  [ChainId.KOVAN]: `https://kovan.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
  [ChainId.XDAI]: "https://rpc.gnosischain.com/",
};

export const SUBGRAPH_ENDPOINT = {
  [ChainId.ETHEREUM]:
    "https://api.thegraph.com/subgraphs/name/kleros/proof-of-humanity-mainnet",
  [ChainId.KOVAN]:
    "https://api.thegraph.com/subgraphs/name/kleros/proof-of-humanity-kovan",
  [ChainId.XDAI]:
    "https://api.thegraph.com/subgraphs/name/andreimvp/poh-gnosis",
};

export const SUPPORTED_CHAINS_IDS = [1, 42, 100];

export const CHAIN_SETTING = {
  [ChainId.ETHEREUM]: {
    chainId: Web3.utils.numberToHex(ChainId.ETHEREUM),
    chainName: ChainName.ETHEREUM,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: [CHAIN_RPC.ETHEREUM],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  [ChainId.KOVAN]: {
    chainId: Web3.utils.numberToHex(ChainId.KOVAN),
    chainName: ChainName.KOVAN,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: [CHAIN_RPC.KOVAN],
    blockExplorerUrls: ["https://kovan.etherscan.io"],
  },
  [ChainId.XDAI]: {
    chainId: Web3.utils.numberToHex(ChainId.XDAI),
    chainName: ChainName.XDAI,
    nativeCurrency: { name: "xDai", symbol: "xDai", decimals: 18 },
    rpcUrls: [CHAIN_RPC.XDAI],
    blockExplorerUrls: ["https://blockscout.com/xdai/mainnet"],
  },
};
