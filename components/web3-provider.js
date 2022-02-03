import { Global } from "@emotion/core";
import WalletConnectWeb3Provider from "@walletconnect/web3-provider";
import Authereum from "authereum";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { useStorageState } from "react-storage-hooks";
import usePromise from "react-use-promise";
import Web3 from "web3";
import Web3Modal from "web3modal";

import { CHAIN_RPC } from "config/chains";

const Context = createContext();

const createWeb3Modal = () =>
  new Web3Modal({
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectWeb3Provider,
        options: {
          rpc: Object.keys(CHAIN_RPC).reduce(
            (acc, chainId) => ({ ...acc, [chainId]: CHAIN_RPC[chainId] }),
            {}
          ),
        },
      },
      authereum: { package: Authereum },
    },
  });

export default function Web3Provider({ chainId, setChainId, children }) {
  const [web3, setWeb3] = useState(() => new Web3(CHAIN_RPC[chainId]));
  const [account, setAccount] = useState("");
  const modal = useMemo(() => createWeb3Modal(), []);

  const disconnect = useCallback(async () => {
    if (web3.currentProvider && web3.currentProvider.close)
      await web3.currentProvider.close();
    await modal.clearCachedProvider();
    setWeb3(() => new Web3(CHAIN_RPC[chainId]));
    setAccount("");
  }, [chainId, modal, web3.currentProvider]);

  const subscribeProvider = useCallback(
    (provider) => {
      if (!provider.on) return;

      provider.on("close", disconnect);
      provider.on("accountsChanged", (accounts) =>
        setAccount(accounts[0] || "")
      );
      provider.on("chainChanged", (_chainId) =>
        setChainId(Web3.utils.hexToNumber(_chainId))
      );
    },
    [disconnect, setChainId]
  );

  const connect = useCallback(async () => {
    const provider = await modal.connect();
    subscribeProvider(provider);
    await provider.enable();

    const _web3 = new Web3(provider);

    const accounts = await _web3.eth.getAccounts();
    setAccount(accounts[0]);
    setChainId(await _web3.eth.net.getId());
    setWeb3(_web3);
  }, [modal, setChainId, subscribeProvider]);

  useEffect(() => {
    if (modal.cachedProvider) connect();
  }, [modal.cachedProvider, connect]);

  const deriveAccount = useCallback(
    async (message, create = true) => {
      const storageKey = `${account}-${message}`;

      let secret = localStorage.getItem(storageKey);
      if (secret === null) {
        if (!create) return secret;
        secret = await web3.eth.personal.sign(message, account);
        localStorage.setItem(storageKey, secret);
      }

      return web3.eth.accounts.privateKeyToAccount(
        Web3.utils.keccak256(secret)
      );
    },
    [account, web3.eth.accounts, web3.eth.personal]
  );

  return (
    <Context.Provider
      value={{ web3, chainId, account, connect, disconnect, deriveAccount }}
    >
      <Global styles={{ ".web3modal-modal-lightbox": { zIndex: 1000 } }} />
      {children}
    </Context.Provider>
  );
}

export const useWeb3 = () => useContext(Context);

const useContract = (_contract, address) => {
  const { web3, account, chainId } = useWeb3();

  return useMemo(
    () =>
      new web3.eth.Contract(
        _contract.ABI,
        address || _contract.ADDRESS[chainId],
        { from: account }
      ),
    [address, chainId, web3, account, _contract]
  );
};

export function useContractSend(_contract, method) {
  const { web3, connect } = useWeb3();
  const contract = useContract(_contract);

  const [sendState, setSendState] = useStorageState(
    localStorage,
    JSON.stringify({ contract: _contract.NAME, method }),
    {}
  );

  const send = useCallback(
    async ({ args, options }) => {
      if (!contract.options.from) await connect();
      if (!contract || !method) return;

      return new Promise((resolve, reject) =>
        contract.methods[method](...args)
          .send(options)
          .on("transactionHash", (transactionHash) => {
            setSendState({ transactionHash });
          })
          .on("confirmation", (confirmation) => {
            setSendState((old) => ({ ...old, confirmation }));
          })
          .on("receipt", (receipt) => {
            setSendState((old) => ({ ...old, receipt }));
            resolve(receipt);
          })
          .on("error", (error) => {
            setSendState((old) => ({ ...old, error }));
            reject(error);
          })
      );
    },
    [contract, method, connect, setSendState]
  );

  const [receipt] = usePromise(
    () =>
      sendState.transactionHash &&
      !sendState.receipt &&
      new Promise((resolve) => {
        const poll = async () => {
          const _receipt = await web3.eth.getTransactionReceipt(
            sendState.transactionHash
          );
          if (_receipt) resolve(_receipt);
          else setTimeout(poll, 2000);
        };
        poll();
      }),
    [sendState.transactionHash, sendState.receipt, web3]
  );

  return {
    receipt,
    ...sendState,
    send,
    loading:
      sendState.transactionHash &&
      !sendState.receipt &&
      !receipt &&
      !sendState.error,
  };
}

const parseRes = (value) => {
  if (typeof value === "object")
    return Object.keys(value).reduce(
      (acc, key) => ({ ...acc, [key]: parseRes(value[key]) }),
      {}
    );

  if (
    typeof value === "boolean" ||
    Number.isNaN(Number(value)) ||
    value.startsWith("0x")
  )
    return value;

  return Web3.utils.toBN(value);
};

export function useContractCall(
  _contract,
  method,
  { address = "", args } = {}
) {
  const contract = useContract(_contract, address);
  const [reCallRef, reCall] = useReducer(() => ({}), {});

  const data = usePromise(
    async () =>
      reCallRef &&
      contract &&
      method &&
      (!args ||
        args.findIndex((value) => value === undefined || value === null) ===
          -1) &&
      parseRes(await contract.methods[method](...(args || [])).call()),
    [reCallRef, contract, args, method]
  );

  return [...data, reCall];
}
