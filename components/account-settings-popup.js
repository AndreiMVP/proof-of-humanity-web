import { Settings } from "@kleros/icons";
import { useCallback, useMemo } from "react";
import { useQuery } from "relay-hooks";
import { Box, Flex, IconButton } from "theme-ui";
import Web3 from "web3";

import Button from "./button";
import Divider from "./divider";
import Identicon from "./identicon";
import Image from "./image";
import NetworkTag from "./network-tag";
import { NextETHLink } from "./next-router";
import Popup from "./popup";
import Tabs, { Tab, TabList, TabPanel } from "./tabs";
import Text from "./text";
import UserSettings from "./user-settings";
import { useContractSend, useWeb3 } from "./web3-provider";

import { appQuery } from "_pages/index/app-query";
import { PROOF_OF_HUMANITY, TBATCHER, ZERO_ADDRESS } from "config/contracts";

export default function AccountSettingsPopup({
  name,
  photo,
  userSettingsURL,
  settings,
  parseSettings,
  normalizeSettings,
}) {
  const { connect, web3, account, chainId, disconnect } = useWeb3();
  const { props } = useQuery(appQuery, {
    contributor: account || ZERO_ADDRESS,
    id: account || ZERO_ADDRESS,
  });

  const { contributions: withdrawableContributions } = props ?? {};
  const { send: batchSend } = useContractSend(TBATCHER, "batchSend");

  const pohInstance = useMemo(
    () =>
      new web3.eth.Contract(
        PROOF_OF_HUMANITY.ABI,
        PROOF_OF_HUMANITY.ADDRESS[chainId]
      ),
    [web3.eth.Contract, chainId]
  );

  const withdrawFeesAndRewards = useCallback(() => {
    if (!batchSend || withdrawableContributions?.length === 0) return;
    const withdrawCalls = withdrawableContributions.map(
      (withdrawableContribution) => {
        const { requestIndex, roundIndex, round } = withdrawableContribution;
        const { challenge } = round;
        const { request, challengeID } = challenge;
        const { submission } = request;
        const { id } = submission;
        return pohInstance.methods
          .withdrawFeesAndRewards(
            account,
            id,
            requestIndex,
            challengeID,
            roundIndex
          )
          .encodeABI();
      }
    );
    batchSend({
      args: [
        [
          ...new Array(withdrawCalls.length).fill(
            PROOF_OF_HUMANITY.ADDRESS[chainId]
          ),
        ],
        [...new Array(withdrawCalls.length).fill(Web3.utils.toBN(0))],
        withdrawCalls,
      ],
    });
  }, [
    account,
    batchSend,
    pohInstance.methods,
    withdrawableContributions,
    chainId,
  ]);

  return (
    <Popup
      contentStyle={{ width: 490 }}
      trigger={
        <IconButton>
          <Settings size="auto" />
        </IconButton>
      }
      position="bottom right"
    >
      <Box
        sx={{
          color: "text",
          paddingX: 1,
          paddingY: 2,
        }}
      >
        <Text
          sx={{
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Settings
        </Text>
        <Tabs>
          <TabList>
            <Tab>Account</Tab>
            <Tab>Notifications</Tab>
          </TabList>
          <TabPanel>
            <Text
              sx={{
                fontSize: 10,
                marginBottom: 3,
              }}
            >
              {account ? (
                <Flex sx={{ alignItems: "center" }}>
                  {photo ? (
                    <Image
                      sx={{
                        objectFit: "contain",
                        width: 32,
                        height: 32,
                      }}
                      variant="avatar"
                      src={photo}
                    />
                  ) : (
                    <Identicon address={account} />
                  )}
                  <Box sx={{ marginLeft: 1 }}>
                    {name && (
                      <Text sx={{ fontSize: 0, marginBottom: "4px" }}>
                        {name}
                      </Text>
                    )}
                    <NextETHLink address={account}>{account}</NextETHLink>
                  </Box>
                </Flex>
              ) : (
                "Connected to RPC"
              )}
            </Text>
            <NetworkTag sx={{ mb: 1 }} />
            <Divider />
            <Button
              sx={{
                display: "block",
                marginTop: -2,
                marginX: "auto",
              }}
              onClick={account ? disconnect : connect}
            >
              {account ? "Disconnect" : "Connect"} Wallet
            </Button>
            {withdrawableContributions?.length > 0 && (
              <Button
                sx={{
                  display: "block",
                  marginTop: 2,
                  marginX: "auto",
                }}
                onClick={withdrawFeesAndRewards}
              >
                Withdraw Fees and Rewards
              </Button>
            )}
          </TabPanel>
          <TabPanel>
            <UserSettings
              userSettingsURL={userSettingsURL}
              settings={settings}
              parseSettings={parseSettings}
              normalizeSettings={normalizeSettings}
            />
          </TabPanel>
        </Tabs>
      </Box>
    </Popup>
  );
}
