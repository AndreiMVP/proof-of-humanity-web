import { Button, useContractSend } from "@kleros/components";
import { useCallback } from "react";

import { PROOF_OF_HUMANITY } from "config/contracts";

export default function WithdrawButton({ sx, ...rest }) {
  const { send: sendWithdraw } = useContractSend(
    PROOF_OF_HUMANITY,
    "withdrawSubmission"
  );

  const handleClick = useCallback(() => sendWithdraw(), [sendWithdraw]);

  return (
    <Button
      {...rest}
      onClick={handleClick}
      sx={{
        backgroundImage({ colors }) {
          const { danger, text } = colors;
          return `linear-gradient(90deg, ${text} -500%, ${danger} 100%)`;
        },
        ...sx,
      }}
    >
      Cancel Submission
    </Button>
  );
}
