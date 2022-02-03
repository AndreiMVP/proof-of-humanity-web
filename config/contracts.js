import { ChainId } from "./enums";

import KlerosLiquidAbi from "subgraph/abis/kleros-liquid";
import ProofOfHumanityAbi from "subgraph/abis/proof-of-humanity";
import TransactionBatcherAbi from "subgraph/abis/transaction-batcher";
import UBIAbi from "subgraph/abis/ubi";
import KovanConfig from "subgraph/config/kovan";
import EthereumConfig from "subgraph/config/mainnet";
import XDaiConfig from "subgraph/config/xdai";

export const PROOF_OF_HUMANITY = {
  ADDRESS: {
    [ChainId.ETHEREUM]: EthereumConfig.address,
    [ChainId.KOVAN]: KovanConfig.address,
    [ChainId.XDAI]: XDaiConfig.address,
  },
  ABI: ProofOfHumanityAbi,
  NAME: "ProofOfHumanity",
};

export const KLEROS_LIQUID = {
  ADDRESS: {
    [ChainId.ETHEREUM]: EthereumConfig.klerosLiquidAddress,
    [ChainId.KOVAN]: KovanConfig.klerosLiquidAddress,
    [ChainId.XDAI]: XDaiConfig.klerosLiquidAddress,
  },
  ABI: KlerosLiquidAbi,
  NAME: "KlerosLiquid",
};

export const UBI = {
  ADDRESS: {
    [ChainId.ETHEREUM]: EthereumConfig.UBIAddress,
    [ChainId.KOVAN]: KovanConfig.UBIAddress,
    [ChainId.XDAI]: XDaiConfig.UBIAddress,
  },
  ABI: UBIAbi,
  NAME: "UBI",
};

export const TBATCHER = {
  ADDRESS: {
    [ChainId.ETHEREUM]: EthereumConfig.transactionBatcherAddress,
    [ChainId.KOVAN]: KovanConfig.transactionBatcherAddress,
    [ChainId.XDAI]: XDaiConfig.transactionBatcherAddress,
  },
  ABI: TransactionBatcherAbi,
  NAME: "TransactionBatcher",
};

const CONTRACTS = {
  [PROOF_OF_HUMANITY.NAME]: PROOF_OF_HUMANITY,
  [KLEROS_LIQUID.NAME]: KLEROS_LIQUID,
  [UBI.NAME]: UBI,
  [TBATCHER.NAME]: TBATCHER,
};
export default CONTRACTS;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
