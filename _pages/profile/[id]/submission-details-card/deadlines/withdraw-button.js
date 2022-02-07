import { Button, useContractSend } from "@kleros/components";

import { PROOF_OF_HUMANITY } from "config/contracts";

export default function WithdrawButton({ sx, ...rest }) {
  const { send: sendWithdraw } = useContractSend(
    PROOF_OF_HUMANITY,
    "withdrawSubmission"
  );

  return (
    <Button
      {...rest}
      onClick={sendWithdraw}
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
