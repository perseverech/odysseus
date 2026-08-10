import worldGeoJson from "./world.json";

import {
  CONTINENTS,
  type Continent,
  type CountryMetadata,
  type TravelMembership,
} from "../models/travel";

type WorldCountryFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
    NAME?: string;
    "ISO3166-1-Alpha-2"?: string;
    ISO_A2?: string;
    iso_a2?: string;
  };
};

const CONTINENT_CODES: Record<Continent, readonly string[]> = {
  Europe: (
    "ad al at ax ba be bg by ch cz de dk ee es fi fo fr gb gg gi " +
    "gr hr hu ie im is it je li lt lu lv mc md me mk mt nl no pl pt " +
    "ro rs ru se si sj sk sm ua va"
  ).split(" "),
  Asia: (
    "ae af am az bd bh bn bt cn cn-tw cy ge hk id il in io iq ir " +
    "jo jp kg kh kp kr kw kz la lb lk mm mn mo mv my np om ph pk " +
    "ps qa sa sg sy th tj tl tm tr uz vn ye"
  ).split(" "),
  Africa: (
    "ao bf bi bj bw cd cf cg ci cm cv dj dz eg eh er et ga gh gm " +
    "gn gq gw ke km lr ls ly ma mg ml mr mu mw mz na ne ng re rw " +
    "sc sd sh sl sn so ss st sz td tg tn tz ug yt za zm zw"
  ).split(" "),
  "North America": (
    "ag ai aw bb bl bm bq bs bz ca cr cu cw dm do gd gl gp gt hn " +
    "ht jm kn ky lc mf mq ms mx ni pa pm pr sv sx tc tt us vc vg vi"
  ).split(" "),
  "South America": (
    "ar bo br cl co ec fk gf gy pe py sr uy ve"
  ).split(" "),
  Oceania: (
    "as au cc ck cx fj fm gu hm ki mh mp nc nf nr nu nz pf pg pn " +
    "pw sb tk to tv um vu wf ws"
  ).split(" "),
};

const CONTINENT_BY_CODE = new Map<string, Continent>();

CONTINENTS.forEach((continent) => {
  CONTINENT_CODES[continent].forEach((code) => {
    CONTINENT_BY_CODE.set(code, continent);
  });
});

const CONTINENT_BY_NAME: Record<string, Continent> = {
  france: "Europe",
  kosovo: "Europe",
  norway: "Europe",
  somaliland: "Africa",
};

const COUNTRY_CODE_BY_NAME: Record<string, string> = {
  france: "fr",
  norway: "no",
  turkey: "tr",
  türkiye: "tr",
};

const EU_CODES = new Set(
  (
    "at be bg hr cy cz dk ee fi fr de gr hu ie it lv lt lu mt nl " +
    "pl pt ro sk si es se"
  ).split(" ")
);

const SCHENGEN_CODES = new Set(
  (
    "at be bg hr cz dk ee fi fr de gr hu is it lv li lt lu mt nl " +
    "no pl pt ro sk si es se ch"
  ).split(" ")
);

const NATO_CODES = new Set(
  (
    "al be bg ca hr cz dk ee fi fr de gr hu is it lv lt lu me nl " +
    "mk no pl pt ro sk si es se tr gb us"
  ).split(" ")
);

export const TOTAL_COUNTRIES = 195;

export function normalizeCountryName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function normalizeCountryCode(countryCode: string) {
  return countryCode.trim().toLocaleLowerCase();
}

export function getMapCountryId(
  countryCode: string,
  countryName: string
) {
  const normalizedCode = normalizeCountryCode(countryCode);

  return normalizedCode && normalizedCode !== "-99"
    ? normalizedCode
    : `name:${normalizeCountryName(countryName)}`;
}

function getMemberships(code: string): TravelMembership[] {
  const memberships: TravelMembership[] = [];

  if (EU_CODES.has(code)) memberships.push("eu");
  if (SCHENGEN_CODES.has(code)) memberships.push("schengen");
  if (NATO_CODES.has(code)) memberships.push("nato");

  return memberships;
}

const countryCatalog = new Map<string, CountryMetadata>();

(
  worldGeoJson as unknown as { features: WorldCountryFeature[] }
).features.forEach((feature) => {
  const properties = feature.properties;
  const countryName = String(
    properties?.name ??
      properties?.ADMIN ??
      properties?.NAME ??
      "Unknown"
  );
  const sourceCode = String(
    properties?.["ISO3166-1-Alpha-2"] ??
      properties?.ISO_A2 ??
      properties?.iso_a2 ??
      ""
  );
  const id = getMapCountryId(sourceCode, countryName);
  const normalizedCode = normalizeCountryCode(sourceCode);
  const normalizedName = normalizeCountryName(countryName);
  const membershipCode =
    normalizedCode === "-99"
      ? COUNTRY_CODE_BY_NAME[normalizedName] ?? ""
      : normalizedCode;

  countryCatalog.set(id, {
    id,
    name: countryName,
    continent:
      CONTINENT_BY_CODE.get(normalizedCode) ??
      CONTINENT_BY_NAME[normalizedName] ??
      null,
    memberships: getMemberships(membershipCode),
  });
});

export function getCountryMetadata(
  countryCode: string
): CountryMetadata {
  const id = normalizeCountryCode(countryCode);
  const existingCountry = countryCatalog.get(id);

  if (existingCountry) {
    return existingCountry;
  }

  return {
    id,
    name: id.startsWith("name:")
      ? id.slice(5).replace(/\b\w/g, (letter) =>
          letter.toLocaleUpperCase()
        )
      : id.toLocaleUpperCase(),
    continent: CONTINENT_BY_CODE.get(id) ?? null,
    memberships: getMemberships(id),
  };
}

export function findCountryMetadataByName(
  countryName: string
): CountryMetadata | null {
  const normalizedName = normalizeCountryName(countryName);

  if (!normalizedName) {
    return null;
  }

  const aliasedCode = COUNTRY_CODE_BY_NAME[normalizedName];

  if (aliasedCode) {
    return countryCatalog.get(aliasedCode) ?? getCountryMetadata(aliasedCode);
  }

  const countryByCode = countryCatalog.get(normalizedName);

  if (countryByCode) {
    return countryByCode;
  }

  for (const country of countryCatalog.values()) {
    if (normalizeCountryName(country.name) === normalizedName) {
      return country;
    }
  }

  return null;
}

export function getCountryFlagEmoji(countryName: string) {
  const countryCode = findCountryMetadataByName(countryName)?.id
    .trim()
    .toLocaleUpperCase();

  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return "🌍";

  return String.fromCodePoint(
    ...Array.from(countryCode).map(
      (letter) => 127397 + letter.charCodeAt(0)
    )
  );
}
