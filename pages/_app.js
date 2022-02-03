import {
  ArchonProvider,
  Box,
  Flex,
  HelpPopup,
  Image,
  Layout,
  Link,
  List,
  ListItem,
  NextLink,
  RelayProvider,
  SocialIcons,
  Text,
  ThemeProvider,
  WalletConnection,
  Web3Provider,
  AccountSettingsPopup as _AccountSettingsPopup,
  createWrapConnection,
  useWeb3,
} from "@kleros/components";
import { ProofOfHumanityLogo, SecuredByKleros } from "@kleros/icons";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { animated, useTransition } from "react-spring";
import { useQuery } from "relay-hooks";

import { indexQuery } from "_pages/index";
import { appQuery } from "_pages/index/app-query";
import { IdQuery } from "_pages/profile/[id]";
import { SUPPORTED_CHAINS_IDS } from "config/chains";
import { queryEnums, useEvidenceFile } from "data";

const queries = { "/": indexQuery, "/profile/:id": IdQuery };

const wrapConnection = createWrapConnection(queries, queryEnums);
const theme = {
  colors: {
    vouching: "#4d00b4",
    pendingRegistration: "#ccc",
    pendingRemoval: "#ff9900",
    challengedRegistration: "#ffc700",
    challengedRemoval: "#ffc700",
    registered: "#009aff",
    removed: "#4a4a4a",
  },
};

function MyProfileLink() {
  const { account } = useWeb3();
  const { props } = useQuery(
    appQuery,
    { id: account?.toLowerCase(), contributor: account?.toLowerCase() },
    { skip: !account }
  );

  const showSubmitProfile =
    !props?.submission ||
    (!props?.submission?.registered && props?.submission?.status === "None");

  return account ? (
    <NextLink href="/profile/[id]" as={`/profile/${account}`}>
      <Link variant="navigation">
        {showSubmitProfile ? "Submit Profile" : "My Profile"}
      </Link>
    </NextLink>
  ) : null;
}

const settings = {
  proofOfHumanityNotifications: {
    label: "Enable",
    info: "Subscribe to updates about submissions you are involved in.",
  },
};

const parseSettings = (rawSettings) =>
  Object.keys(settings).reduce(
    (acc, setting) => ({
      ...acc,
      [setting]: rawSettings?.payload?.settings?.Item?.[setting]?.BOOL || false,
    }),
    { email: rawSettings?.payload?.settings?.Item?.email?.S || "" }
  );

const normalizeSettings = ({ email, ...rest }) =>
  Object.keys(rest).reduce(
    (acc, setting) => ({
      ...acc,
      [setting]: { BOOL: rest[setting] || false },
    }),
    { email: { S: email } }
  );

function AccountSettingsPopup() {
  const { account } = useWeb3();
  const { props } = useQuery(
    appQuery,
    { id: account?.toLowerCase(), contributor: account?.toLowerCase() },
    { skip: !account }
  );
  const evidenceURI = props?.submission?.requests[0].evidence[0].URI;
  const getEvidenceFile = useEvidenceFile();

  const evidence = evidenceURI ? getEvidenceFile(evidenceURI) : null;
  const displayName =
    [evidence?.file.firstName, evidence?.file.lastName]
      .filter(Boolean)
      .join(" ") || evidence?.file.name;

  return (
    <_AccountSettingsPopup
      name={displayName}
      photo={evidenceURI && getEvidenceFile(evidenceURI)?.file?.photo}
      userSettingsURL="https://hgyxlve79a.execute-api.us-east-2.amazonaws.com/production/user-settings"
      settings={settings}
      parseSettings={parseSettings}
      normalizeSettings={normalizeSettings}
    />
  );
}

const header = {
  sx: {
    flexWrap: "wrap",
    paddingY: 0,
    "> div:first-of-type": {
      flexBasis: "auto",
      paddingY: 2,
    },
    "> div:nth-of-type(2)": {
      flexBasis: 400,
    },
    "> div:last-of-type": {
      flexBasis: "auto",
      paddingY: 2,
    },
  },
  left: (
    <NextLink href="/">
      <Link variant="unstyled" sx={{ display: "flex" }}>
        <ProofOfHumanityLogo size={32} />
        <Box sx={{ marginLeft: 1 }}>
          <Text>PROOF OF</Text>
          <Text>HUMANITY</Text>
        </Box>
      </Link>
    </NextLink>
  ),
  middle: (
    <List
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-around",
        listStyle: "none",
        width: "100%",
      }}
    >
      <ListItem sx={{ marginX: 2, paddingY: 2 }}>
        <NextLink href="/">
          <Link variant="navigation">Profiles</Link>
        </NextLink>
      </ListItem>
      <ListItem sx={{ marginX: 2, paddingY: 2 }}>
        <MyProfileLink />
      </ListItem>
      <ListItem sx={{ marginX: 2, paddingY: 2 }}>
        <Link
          variant="navigation"
          newTab
          href="https://pools.proofofhumanity.id/"
        >
          Pools
        </Link>
      </ListItem>
    </List>
  ),
  right: (
    <Flex
      sx={{
        alignItems: "center",
        gap: ["16px", "8px", 0],

        "> button": {
          cursor: "pointer",
          padding: [0, "4px", "8px"],

          ":hover, :focus": {
            opacity: 0.8,
            outline: "none",
          },

          "> svg": {
            fill: "white",
          },
        },
      }}
    >
      <WalletConnection
        buttonProps={{
          sx: {
            backgroundColor: "white",
            backgroundImage: "none !important",
            color: "accent",
            boxShadow: "none !important",
            fontSize: [16, 12],
            px: "16px !important",
            py: "8px !important",
            mx: [0, "4px", "8px"],
          },
        }}
        tagProps={{
          sx: {
            opacity: 0.8,
            fontSize: [20, 16, 12],
            mx: [0, "4px", "8px"],
          },
        }}
      />
      <Link href="https://snapshot.org/#/poh.eth/">
        <Image src="/images/governance.png" width={25} sx={{ margin: 1 }} />
      </Link>
      <AccountSettingsPopup />
      <HelpPopup />
    </Flex>
  ),
};

const footer = {
  sx: {
    flexWrap: "wrap",
    paddingY: 0,
    "> div:first-of-type": {
      flexBasis: "auto",
      paddingY: 2,
    },
    "> div:last-of-type": {
      flexBasis: "auto",
      paddingY: 2,
    },
  },
  middle: (
    <Link
      sx={{ alignItems: "center", display: "flex" }}
      newTab
      href="https://kleros.io"
    >
      <SecuredByKleros sx={{ width: 200 }} />
    </Link>
  ),
  left: (
    <Link
      variant="navigation"
      sx={{ fontSize: 1 }}
      newTab
      href="https://www.proofofhumanity.id/"
    >
      Learn More
    </Link>
  ),
  right: <SocialIcons color="#ffffff" />,
};

const AnimatedBox = animated(Box);

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [chainId, setChainId] = useState(1);
  const [routeChangeConnection, setRouteChangeConnection] = useState();

  const connectToRouteChange = useCallback((connection) => {
    const wrappedConnection = wrapConnection(connection);
    wrappedConnection(location.pathname + location.search);
    setRouteChangeConnection(() => wrappedConnection);
  }, []);

  useEffect(() => {
    if (routeChangeConnection) {
      router.events.on("routeChangeStart", routeChangeConnection);
      return () => router.events.off("routeChangeStart", routeChangeConnection);
    }
  }, [routeChangeConnection, router.events]);

  const transitions = useTransition(
    [{ key: router.route, Component, pageProps }],
    (item) => item.key,
    {
      from: { opacity: 0, transform: "translate3d(0%,0,0)" },
      enter: { opacity: 1, transform: "translate3d(0%,0,0)" },
      leave: {
        opacity: 0,
        position: "absolute",
        transform: "translate3d(-100%,0,0)",
      },
    }
  );

  if (!SUPPORTED_CHAINS_IDS.includes(chainId))
    return (
      <Flex
        sx={{
          alignItems: "center",
          height: "100vh",
          justifyContent: "center",
          width: "100vw",
        }}
      >
        Unsupported network.
      </Flex>
    );

  return (
    <RelayProvider
      queries={queries}
      chainId={chainId}
      connectToRouteChange={connectToRouteChange}
    >
      <Web3Provider chainId={chainId} setChainId={setChainId}>
        <ArchonProvider>
          <ThemeProvider theme={theme}>
            <Layout header={header} footer={footer}>
              {transitions.map(({ key, props, item }) => (
                <AnimatedBox
                  key={key}
                  style={{
                    ...props,
                    transform: props.transform.interpolate((t) =>
                      t === "translate3d(0%,0,0)" ? undefined : t
                    ),
                  }}
                  sx={{ padding: 3 }}
                >
                  <item.Component {...item.pageProps} />
                </AnimatedBox>
              ))}
            </Layout>
          </ThemeProvider>
        </ArchonProvider>
      </Web3Provider>
    </RelayProvider>
  );
}
