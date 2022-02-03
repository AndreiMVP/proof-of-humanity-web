import { Buffer } from "buffer";

import Archon from "@kleros/archon";
import Dataloader from "dataloader";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import usePromise from "react-use-promise";

import { useWeb3 } from "./web3-provider";

import { CHAIN_KEY } from "config/chains";

const Context = createContext();
const sanitize = (input) =>
  input
    .toString()
    .toLowerCase()
    .replace(/([^\d.a-z]+)/gi, "-"); // Only allow numbers and alphanumeric.

export default function ArchonProvider({ children }) {
  const { web3 } = useWeb3();
  const [archon] = useState(
    () =>
      new Archon(
        web3.currentProvider,
        `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}`
      )
  );

  useEffect(() => {
    if (web3.currentProvider !== archon.arbitrable.web3.currentProvider)
      archon.setProvider(web3.currentProvider);
  }, [web3.currentProvider, archon]);

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          archon,
          upload(fileName, buffer) {
            return fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/add`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: sanitize(fileName),
                buffer: Buffer.from(buffer),
              }),
            })
              .then((res) => res.json())
              .then(
                ({ data }) =>
                  new URL(
                    `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${data[1].hash}${data[0].path}`
                  )
              );
          },
          uploadWithProgress(fileName, buffer, { onProgress = () => {} } = {}) {
            const xhr = new XMLHttpRequest();

            let loadListener;
            let errorListener;

            const responsePromise = new Promise((resolve, reject) => {
              xhr.open("POST", `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/add`);
              xhr.setRequestHeader("Content-Type", "application/json");

              loadListener = () => {
                resolve(xhr.response);
              };

              errorListener = () => {
                const err = new Error("Failed to submit the request");
                err.status = xhr.status;
                reject(err);
              };

              xhr.addEventListener("load", loadListener);
              xhr.addEventListener("error", errorListener);
            });

            xhr.upload.addEventListener("progress", onProgress);

            xhr.send(
              JSON.stringify({
                fileName,
                buffer: Buffer.from(buffer),
              })
            );

            const promise = Promise.resolve().then(() =>
              responsePromise
                .then((res) => JSON.parse(res))
                .then(
                  ({ data }) =>
                    new URL(
                      `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${data[1].hash}${data[0].path}`
                    )
                )
            );

            promise.then(() => {
              xhr.removeEventListener("load", loadListener);
              xhr.removeEventListener("error", errorListener);
              xhr.upload.removeEventListener("progress", onProgress);
            });

            return promise;
          },
        }),
        [archon]
      )}
    >
      {children}
    </Context.Provider>
  );
}

export function useArchon() {
  return useContext(Context);
}

export function createUseDataloaders(fetchers) {
  const dataloaders = Object.keys(fetchers).reduce(
    (acc, name) => ({
      ...acc,
      [name]: new Dataloader(
        (argsArr) =>
          Promise.all(
            argsArr.map((args) => fetchers[name](...args).catch((err) => err))
          ),
        { cacheKeyFn: ([, ...args]) => JSON.stringify(args) }
      ),
    }),
    {}
  );

  return Object.keys(dataloaders).reduce(
    (acc, name) => ({
      ...acc,
      [name]: function useDataloader() {
        const [state, setState] = useState({});
        const loadedRef = useRef({});
        const mountedRef = useRef({});
        useEffect(() => () => (mountedRef.current = false), []);

        const { web3 } = useWeb3();
        const { archon } = useArchon();

        return (...args) => {
          const key = JSON.stringify(args);
          const cacheResult = (res) => {
            if (mountedRef.current) {
              loadedRef.current[key] = true;
              setState((_state) => ({ ..._state, [key]: res }));
            }
          };
          return loadedRef.current[key]
            ? state[key]
            : dataloaders[name]
                .load([{ web3, archon }, ...args])
                .then(cacheResult, cacheResult) && undefined;
        };
      },
    }),
    {}
  );
}

export const createDerivedAccountAPIs = (APIDescriptors, userSettingsURL) =>
  APIDescriptors.map(
    ({ method, URL, payloadKey }) =>
      function useAPI(payload) {
        const isGet = method === "GET";

        const { web3, account, deriveAccount, chainId } = useWeb3();
        const [promise, setPromise] = useState();

        const apiCall = useCallback(
          async (_payload) => {
            const derivedAccount = await deriveAccount(
              "To keep your data safe and to use certain features, we ask that you sign this message to create a secret key for your account. This key is unrelated from your main Ethereum account and will not be able to send any transactions.",
              method !== "GET"
            );

            const fetcher = () =>
              fetch(URL, {
                method: method === "GET" ? "POST" : method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  payload: {
                    address: account,
                    network: CHAIN_KEY[chainId],
                    signature: derivedAccount?.sign?.(JSON.stringify(payload))
                      .signature,
                    [payloadKey]: _payload,
                  },
                }),
              }).then((res) => res.json());

            const res = await fetcher();

            if (res.error && derivedAccount) {
              const settings = {
                derivedAccountAddress: { S: derivedAccount.address },
              };
              await fetch(userSettingsURL, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  payload: {
                    address: account,
                    signature: await web3.eth.personal.sign(
                      JSON.stringify(settings),
                      account
                    ),
                    settings,
                  },
                }),
              }).then((_res) => _res.json());

              return fetcher();
            }

            return res;
          },
          [account, chainId, deriveAccount, payload, web3.eth.personal]
        );

        const data = usePromise(
          () => (isGet ? apiCall(payload) : promise),
          [isGet, payload, promise, apiCall]
        );

        return isGet
          ? data
          : {
              send(_payload) {
                const _promise = apiCall({ payload, ..._payload });
                setPromise(_promise);
                return _promise;
              },
              data,
            };
      }
  );
