import {
  Button,
  Card,
  Field,
  FileUpload,
  Form,
  Popup,
  Text,
  Textarea,
  useArchon,
  useContractCall,
  useContractSend,
} from "@kleros/components";
import { useMemo } from "react";
import { graphql, useFragment } from "relay-hooks";
import Web3 from "web3";

import useIsGraphSynced from "_pages/index/use-is-graph-synced";
import { KLEROS_LIQUID, PROOF_OF_HUMANITY } from "config/contracts";

const removeButtonFragments = {
  contract: graphql`
    fragment removeButtonContract on Contract {
      submissionBaseDeposit
      sharedStakeMultiplier
    }
  `,
  request: graphql`
    fragment removeButtonRequest on Request {
      arbitrator
      arbitratorExtraData
    }
  `,
};

const createValidationSchema = ({ string, file }) => ({
  name: string().max(50, "Must be 50 characters or less.").required("Required"),
  description: string()
    .max(300, "Must be 300 characters or less.")
    .required("Required"),
  file: file(),
});

export default function RemoveButton({ request, contract, submissionID }) {
  const { arbitrator, arbitratorExtraData } = useFragment(
    removeButtonFragments.request,
    request
  );
  const { upload } = useArchon();

  const [arbitrationCost] = useContractCall(
    KLEROS_LIQUID,
    "arbitrationCost",
    useMemo(
      () => ({ address: arbitrator, args: [arbitratorExtraData] }),
      [arbitrator, arbitratorExtraData]
    )
  );
  const { submissionBaseDeposit } = useFragment(
    removeButtonFragments.contract,
    contract
  );
  const totalCost = arbitrationCost?.add(
    Web3.utils.toBN(submissionBaseDeposit)
  );

  const { receipt, send } = useContractSend(
    PROOF_OF_HUMANITY,
    "removeSubmission"
  );
  const isGraphSynced = useIsGraphSynced(receipt?.blockNumber);
  return (
    <Popup
      contentStyle={{ width: undefined }}
      trigger={
        <Button
          sx={{
            marginY: 1,
            width: "100%",
          }}
          loading={!isGraphSynced}
        >
          Request Removal
        </Button>
      }
      modal
    >
      {(close) => (
        <Form
          sx={{ fontWeight: "bold", padding: 2 }}
          createValidationSchema={createValidationSchema}
          onSubmit={async ({ name, description, file }) => {
            let evidence = { name, description };
            if (file)
              evidence.fileURI = (
                await upload(file.name, file.content)
              ).pathname;
            ({ pathname: evidence } = await upload(
              "evidence.json",
              JSON.stringify(evidence)
            ));
            await send({
              args: [submissionID, evidence],
              options: { value: totalCost },
            });
            close();
          }}
        >
          {({ isSubmitting }) => (
            <>
              <Text sx={{ fontSize: 1, marginBottom: 1 }}>Deposit:</Text>
              <Card
                variant="muted"
                sx={{ fontSize: 2, marginBottom: 3 }}
                mainSx={{ padding: 0 }}
              >
                <Text>
                  {totalCost && `${Web3.utils.fromWei(totalCost)} ETH`}
                </Text>
              </Card>
              <Field
                name="name"
                label="Evidence Name"
                placeholder="E.g. The submitter is not a real person."
              />
              <Field
                as={Textarea}
                name="description"
                label="Evidence Description (Your Arguments)"
              />
              <Field
                as={FileUpload}
                name="file"
                label="File"
                accept="image/png, image/jpeg, application/pdf"
                maxSize={2 * 1024 * 1024}
              />
              <Button
                sx={{ display: "block", margin: "auto" }}
                type="submit"
                disabled={!totalCost}
                loading={isSubmitting}
              >
                Request Removal
              </Button>
            </>
          )}
        </Form>
      )}
    </Popup>
  );
}
