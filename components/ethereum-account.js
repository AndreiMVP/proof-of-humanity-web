import Skeleton from "react-loading-skeleton";
import { Box } from "theme-ui";

import Identicon from "./identicon";
import { NextETHLink } from "./next-router";
import Text from "./text";

import { ZERO_ADDRESS } from "config/contracts";

export default function EthereumAccount({
  address = ZERO_ADDRESS,
  diameter = 24,
  sx,
}) {
  return address ? (
    <NextETHLink
      address={address}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        lineHeight: 1,
        textDecoration: "none",
        ":hover, :active, :focus": {
          textDecoration: "underline",
        },
        ...sx,
      }}
    >
      <Identicon
        diameter={diameter}
        address={address}
        sx={{ minWidth: diameter }}
      />
      <Text variant="clipped">{address}</Text>
    </NextETHLink>
  ) : (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        lineHeight: 0,
        ...sx,

        "> span:first-of-type": {
          flex: "auto 0 0",
        },
        "> span:last-of-type": {
          flex: "auto 1 1",
        },
      }}
    >
      <Skeleton circle height={diameter} width={diameter} />
      <Skeleton height={Math.min(diameter / 2, 12)} />
    </Box>
  );
}
