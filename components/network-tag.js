import { Ether, Gnosis } from "@kleros/icons";
import ReactLoadingSkeleton from "react-loading-skeleton";
import { Box, Button, Flex } from "theme-ui";
import Web3 from "web3";

import Popup from "./popup";
import Text from "./text";
import { useWeb3 } from "./web3-provider";

import { CHAIN_NAME, CHAIN_SETTING } from "config/chains";

const SHOWN_CHAINS = { 1: Ether, 100: Gnosis };

export default function NetworkTag() {
  const { web3, chainId } = useWeb3();

  if (!chainId) return <ReactLoadingSkeleton />;

  const CurrentChainLogo = SHOWN_CHAINS[chainId];

  return (
    <Popup
      contentStyle={{ width: 320 }}
      trigger={
        <Button
          sx={{
            background: "none !important",
            border: "1px solid white",
            display: "flex",
            alignItems: "center",
            color: "white",
            fontSize: [16, 12],
            px: "16px !important",
            py: "8px !important",
            mx: [0, "4px", "8px"],
          }}
        >
          {CurrentChainLogo && <CurrentChainLogo size="16" />}
          {CHAIN_NAME[chainId.toString()]}
        </Button>
      }
      position="bottom right"
    >
      <Box sx={{ color: "text", paddingX: 1, paddingY: 1 }}>
        {Object.keys(SHOWN_CHAINS).map((_chainId) => {
          const Logo = SHOWN_CHAINS[_chainId];
          return (
            <Button
              key={_chainId}
              sx={{
                width: "100%",
                background: "none",
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid",
                borderRadius: "3px",
                borderColor: "primary",
                color: "black",
                cursor: "pointer",
              }}
              onClick={() => {
                web3.currentProvider.sendAsync(
                  {
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: Web3.utils.numberToHex(_chainId) }],
                  },
                  (err) => {
                    if (err && err.code === 4902)
                      web3.currentProvider.sendAsync({
                        method: "wallet_addEthereumChain",
                        params: [CHAIN_SETTING[_chainId]],
                      });
                  }
                );
              }}
            >
              <Flex>
                <Logo
                  sx={{ fill: "black !important", margin: "0 6px 0 10px" }}
                />
                <Text sx={{ fontWeight: "bold", textAlign: "center" }}>
                  {CHAIN_NAME[_chainId]}
                </Text>
              </Flex>
            </Button>
          );
        })}
      </Box>
    </Popup>
  );
}
