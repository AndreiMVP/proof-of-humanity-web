import lodashKebabCase from "lodash.kebabcase";
import lodashStartCase from "lodash.startcase";

export const createEnum = (keys, parse) => {
  const _enum = keys.reduce(
    (acc, key, index) => {
      let extra;
      if (Array.isArray(key)) [key, extra] = key;

      const value = {
        key,
        index,
        camelCase: key[0].toLowerCase() + key.slice(1),
        kebabCase: lodashKebabCase(key),
        startCase: lodashStartCase(key),
        ...extra,
      };
      value.color = value.camelCase;
      value.toString = () => value.startCase;

      acc[key] = value;
      acc[index] = value;
      acc[value.camelCase] = value;
      acc[value.kebabCase] = value;
      acc[value.startCase] = value;
      return acc;
    },
    {
      parse:
        parse ||
        ((arrayOrKey) =>
          Array.isArray(arrayOrKey)
            ? arrayOrKey.reduce((acc, key) => {
                const value = _enum[key];
                acc[key] = value;
                acc[value.index] = value;
                acc[value.camelCase] = value;
                acc[value.kebabCase] = value;
                acc[value.startCase] = value;
                return acc;
              }, {})
            : _enum[arrayOrKey]),
    }
  );
  _enum.array = keys.map((_, index) => _enum[index]);
  return _enum;
};
