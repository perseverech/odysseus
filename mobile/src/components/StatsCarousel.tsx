import React, { useMemo, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

type Props = {
  visitedCountries: string[];
};

type CountryInfo = {
  continent:
    | "Europe"
    | "Asia"
    | "Africa"
    | "North America"
    | "South America"
    | "Oceania";

  eu?: boolean;
  schengen?: boolean;
  nato?: boolean;
};

const COUNTRY_DATA: Record<string, CountryInfo> = {
  lv: {
    continent: "Europe",
    eu: true,
    schengen: true,
    nato: true,
  },
  es: {
    continent: "Europe",
    eu: true,
    schengen: true,
    nato: true,
  },
  tr: {
    continent: "Asia",
    nato: true,
  },
};

const CONTINENTS = [
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
] as const;

const TOTAL_COUNTRIES = 195;

export default function StatsCarousel({
  visitedCountries,
}: Props) {
  const [activePage, setActivePage] = useState(0);

  const { width } = useWindowDimensions();
  const cardWidth = width - 40;

  const statistics = useMemo(() => {
    const continentCounts: Record<string, number> = {};

    CONTINENTS.forEach((continent) => {
      continentCounts[continent] = 0;
    });

    let eu = 0;
    let schengen = 0;
    let nato = 0;

    visitedCountries.forEach((countryId) => {
      const id = countryId.toLowerCase();
      const info = COUNTRY_DATA[id];

      if (!info) return;

      continentCounts[info.continent] += 1;

      if (info.eu) eu += 1;
      if (info.schengen) schengen += 1;
      if (info.nato) nato += 1;
    });

    const continentsVisited = Object.values(
      continentCounts
    ).filter((count) => count > 0).length;

    const worldPercentage =
      (visitedCountries.length / TOTAL_COUNTRIES) * 100;

    return {
      continentCounts,
      continentsVisited,
      worldPercentage,
      eu,
      schengen,
      nato,
    };
  }, [visitedCountries]);

  function onScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const x = event.nativeEvent.contentOffset.x;
    const page = Math.round(x / cardWidth);

    setActivePage(page);
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        <View style={[styles.page, { width: cardWidth }]}>
          <Header title="OVERVIEW" number="1 / 3" />

          <View style={styles.overviewRow}>
            <Stat
              value={visitedCountries.length}
              label="countries"
            />

            <Stat
              value={statistics.continentsVisited}
              label="continents"
            />

            <Stat
              value={`${statistics.worldPercentage.toFixed(1)}%`}
              label="of world"
            />
          </View>
        </View>

        <View style={[styles.page, { width: cardWidth }]}>
          <Header title="CONTINENTS" number="2 / 3" />

          <View style={styles.continentGrid}>
            {CONTINENTS.map((continent) => (
              <View
                key={continent}
                style={styles.continentItem}
              >
                <Text style={styles.continentName}>
                  {continent}
                </Text>

                <Text style={styles.continentNumber}>
                  {statistics.continentCounts[continent]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.page, { width: cardWidth }]}>
          <Header title="REGIONS" number="3 / 3" />

          <View style={styles.regionContainer}>
            <Region
              name="European Union"
              count={statistics.eu}
            />

            <Region
              name="Schengen Area"
              count={statistics.schengen}
            />

            <Region
              name="NATO"
              count={statistics.nato}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.dots}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activePage === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function Header({
  title,
  number,
}: {
  title: string;
  number: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{title}</Text>
      <Text style={styles.pageNumber}>{number}</Text>
    </View>
  );
}

function Stat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Region({
  name,
  count,
}: {
  name: string;
  count: number;
}) {
  return (
    <View style={styles.regionRow}>
      <Text style={styles.regionName}>{name}</Text>
      <Text style={styles.regionCount}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  page: {
    minHeight: 118,
    paddingHorizontal: 17,
    paddingTop: 14,
    paddingBottom: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#777777",
  },

  pageNumber: {
    fontSize: 10,
    color: "#B3B3B3",
  },

  overviewRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  stat: {
    flex: 1,
  },

  statValue: {
    fontSize: 23,
    fontWeight: "700",
    color: "#111111",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#777777",
  },

  continentGrid: {
    marginTop: 9,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  continentItem: {
    width: "50%",
    paddingVertical: 4,
    paddingRight: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  continentName: {
    fontSize: 11.5,
    color: "#777777",
  },

  continentNumber: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#111111",
  },

  regionContainer: {
    marginTop: 9,
  },

  regionRow: {
    minHeight: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  regionName: {
    fontSize: 12,
    color: "#777777",
  },

  regionCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },

  dots: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D8D8D8",
  },

  activeDot: {
    width: 15,
    backgroundColor: "#C9B8FF",
  },
});