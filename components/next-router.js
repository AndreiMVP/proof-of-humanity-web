import _NextLink from "next/link";
import { match } from "path-to-regexp";

import Link from "./link";
import { useWeb3 } from "./web3-provider";

import { CHAIN_SETTING } from "config/chains";

export function NextLink({ passHref = true, href, as, ...rest }) {
  href = typeof href === "string" ? new URL(href, "http://localhost") : href;
  const hrefQuery = href.query
    ? href.query
    : Object.fromEntries(href.searchParams?.entries() ?? {});

  const queryString =
    Object.keys(hrefQuery).length > 0
      ? `?${new URLSearchParams(hrefQuery)}`
      : "";

  return (
    <_NextLink
      passHref={passHref}
      href={{
        pathname: href.pathname || href,
        query: hrefQuery,
      }}
      as={as && as + queryString}
      {...rest}
    />
  );
}

export function NextETHLink({ address, children = address, ...rest }) {
  const { chainId } = useWeb3();
  return (
    <Link
      newTab
      href={`${CHAIN_SETTING[chainId].blockExplorerUrls[0]}/address/${address}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

export const createWrapConnection = (queries, queryEnums) => {
  const matchers = Object.keys(queries).reduce(
    (acc, key) => ({
      ...acc,
      [key]: match(key, { decode: decodeURIComponent }),
    }),
    {}
  );

  const parseAsPath = (asPath) => {
    let [path, query] = asPath.split("?");

    const funcQueryEnumQueries = [];
    query = [...new URLSearchParams(query).entries()].reduce(
      (acc, [key, value]) => {
        const queryEnumQuery = queryEnums[key]?.[value]?.query;
        if (typeof queryEnumQuery === "function")
          funcQueryEnumQueries.push(queryEnumQuery);
        else if (queryEnumQuery) acc = { ...acc, ...queryEnumQuery };
        else
          acc[key] =
            typeof value === "boolean" ||
            Number.isNaN(Number(value)) ||
            value.startsWith("0x")
              ? value
              : Number(value);
        return acc;
      },
      {}
    );
    for (const funcQueryEnumQuery of funcQueryEnumQueries)
      query = { ...query, ...funcQueryEnumQuery(query) };

    for (const [key, matcher] of Object.entries(matchers)) {
      const _match = matcher(path);
      if (_match) {
        path = key;
        query = {
          ...query,
          ...Object.keys(_match.params).reduce((acc, _key) => {
            acc[_key] = _match.params[_key].toLowerCase
              ? _match.params[_key].toLowerCase()
              : _match.params[_key];
            acc[`_${_key}`] = [acc[_key]];
            return acc;
          }, {}),
        };
        break;
      }
    }

    if (query.search) query.address = query.search;
    return { path, query };
  };

  const wrapConnection = (connection) => (asPath) => {
    const { path, query } = parseAsPath(asPath);
    connection(path, query);
  };
  wrapConnection.parseAsPath = parseAsPath;
  return wrapConnection;
};
