import Button from "./button";
import NetworkTag from "./network-tag";
import { useWeb3 } from "./web3-provider";

export default function WalletConnection() {
  const { account, connect } = useWeb3();

  if (account) return <NetworkTag />;

  return (
    <Button
      sx={{
        backgroundColor: "white",
        backgroundImage: "none !important",
        color: "accent",
        boxShadow: "none !important",
        fontSize: [16, 12],
        px: "16px !important",
        py: "8px !important",
        mx: [0, "4px", "8px"],
      }}
      onClick={connect}
    >
      Connect
    </Button>
  );
}
