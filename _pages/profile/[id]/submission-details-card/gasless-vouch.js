import {
  Box,
  Button,
  Popup,
  Text,
  useContractCall,
  useWeb3,
} from "@kleros/components";
import { Warning } from "@kleros/icons";
import { useCallback, useMemo, useState } from "react";

import { PROOF_OF_HUMANITY } from "config/contracts";

const vouchText = `
Make sure the person exists and that you have physically encountered
them. Note that in the case of a dispute, if a submission is
rejected for reason “Duplicate” or “Does not exist”, everyone who
had vouched for it will get removed from the registry. Note that
your vouch will only be counted when and as long as you are
registered, and another submission is not using your vouch.
`;

export default function GaslessVouchButton({ submissionID }) {
  const { web3, connect, account, chainId } = useWeb3();
  const [addVouchLabel, setAddVouchLabel] = useState(vouchText);
  const [registered] = useContractCall(
    PROOF_OF_HUMANITY,
    "isRegistered",
    useMemo(() => ({ args: [account] }), [account])
  );
  const [vouched] = useContractCall(
    PROOF_OF_HUMANITY,
    "vouches",
    useMemo(() => ({ args: [account, submissionID] }), [account, submissionID])
  );

  const signVouch = useCallback(async () => {
    if (!account) return connect();

    const messageParameters = JSON.stringify({
      domain: {
        chainId,
        name: "Proof of Humanity",
        verifyingContract: PROOF_OF_HUMANITY.ADDRESS[chainId],
      },
      message: {
        vouchedSubmission: submissionID,
        voucherExpirationTimestamp:
          Math.floor(Date.now() / 1000) + 6 * 30 * 24 * 60 * 60, // Expire in about ~6 months.
      },
      primaryType: "IsHumanVoucher",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        IsHumanVoucher: [
          { name: "vouchedSubmission", type: "address" },
          { name: "voucherExpirationTimestamp", type: "uint256" },
        ],
      },
    });

    const from = account;
    const parameters = [from, messageParameters];
    const method = "eth_signTypedData_v4";

    const promiseRequestSignature = () =>
      new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync(
          { method, params: parameters, from },
          (err, result) => (err ? reject(err) : resolve(result))
        );
      });

    const { result: signature } = await promiseRequestSignature();

    return fetch(`${process.env.NEXT_PUBLIC_VOUCH_DB_URL}/vouch/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signature,
        msgData: messageParameters,
      }),
    });
  }, [account, submissionID, chainId, connect, web3]);

  return registered || vouched ? (
    <Popup
      trigger={
        <Button
          sx={{
            marginTop: 2,
            marginBottom: 0,
            width: "100%",
            backgroundImage:
              "linear-gradient(90deg,var(--theme-ui-colors-primary,#007cff) 0%,var(--theme-ui-colors-secondary,#00b7ff) 100%)",
          }}
        >
          {vouched ? "Remove" : "Gasless"} Vouch
        </Button>
      }
      modal
    >
      {(close) => (
        <Box sx={{ padding: 2 }}>
          <Warning />
          <Text sx={{ marginBottom: 2 }}>{addVouchLabel}</Text>
          {addVouchLabel !== "Vouch saved successfully." && (
            <Button
              onClick={() => {
                signVouch().then(() => {
                  setAddVouchLabel("Vouch saved successfully.");
                  setTimeout(close, 3000);
                });
              }}
            >
              Gasless Vouch
            </Button>
          )}
        </Box>
      )}
    </Popup>
  ) : null;
}
