import React, { useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { CONTINENTS, type TravelStatistics } from "../models/travel";

type Props = {
  statistics: TravelStatistics;
};

const PAGE_COUNT = 4;

export default function StatsCarousel({ statistics }: Props) {
  const [activePage, setActivePage] = useState(0);
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;

  function onScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const x = event.nativeEvent.contentOffset.x;
    const page = Math.round(x / cardWidth);

    setActivePage(Math.max(0, Math.min(PAGE_COUNT - 1, page)));
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
          <Header title="OVERVIEW" page={1} />

          <View style={styles.overviewGrid}>
            <Stat
              value={statistics.countryCount}
              label="Countries"
            />
            <Stat value={statistics.cityCount} label="Cities" />
            <Stat
              value={statistics.continentCount}
              label="Continents"
            />
            <Stat
              value={`${statistics.worldPercentage.toFixed(1)}%`}
              label="Of world"
            />
          </View>
        </View>

        <View style={[styles.page, { width: cardWidth }]}>
          <Header title="CONTINENTS" page={2} />

          <View style={styles.continentGrid}>
            {CONTINENTS.map((continent) => (
              <View key={continent} style={styles.continentItem}>
                <Text style={styles.continentName}>{continent}</Text>
                <Text style={styles.continentNumber}>
                  {statistics.continentCounts[continent]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.page, { width: cardWidth }]}>
          <Header title="REGIONS / MEMBERSHIPS" page={3} />

          <View style={styles.regionContainer}>
            <Region
              name="European Union"
              abbreviation="EU"
              count={statistics.membershipCounts.eu}
            />
            <Region
              name="Schengen Area"
              abbreviation="SCHENGEN"
              count={statistics.membershipCounts.schengen}
            />
            <Region
              name="North Atlantic Treaty Organization"
              abbreviation="NATO"
              count={statistics.membershipCounts.nato}
            />
          </View>
        </View>

        <View style={[styles.page, { width: cardWidth }]}>
          <Header title="TRAVEL HISTORY" page={4} />

          <View style={styles.historyRow}>
            <Stat
              value={statistics.tripCount}
              label="Trips"
              threeColumn
            />
            <Stat
              value={statistics.countriesThisYear}
              label="Countries this year"
              threeColumn
            />
            <Stat
              value={statistics.mostExploredContinent ?? "—"}
              label="Most explored"
              compact
              threeColumn
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.dots}>
        {Array.from({ length: PAGE_COUNT }, (_, index) => (
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

function Header({ title, page }: { title: string; page: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{title}</Text>
      <Text style={styles.pageNumber}>
        {page} / {PAGE_COUNT}
      </Text>
    </View>
  );
}

function Stat({
  value,
  label,
  compact = false,
  threeColumn = false,
}: {
  value: string | number;
  label: string;
  compact?: boolean;
  threeColumn?: boolean;
}) {
  return (
    <View style={[styles.stat, threeColumn && styles.thirdStat]}>
      <Text
        style={[styles.statValue, compact && styles.compactStatValue]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Region({
  name,
  abbreviation,
  count,
}: {
  name: string;
  abbreviation: string;
  count: number;
}) {
  return (
    <View style={styles.regionRow}>
      <View style={styles.regionTextArea}>
        <Text style={styles.regionAbbreviation}>{abbreviation}</Text>
        <Text style={styles.regionName} numberOfLines={1}>
          {name}
        </Text>
      </View>
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
    minHeight: 154,
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
    letterSpacing: 1.35,
    color: "#777777",
  },
  pageNumber: {
    fontSize: 10,
    color: "#B3B3B3",
  },
  overviewGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "center",
    marginTop: 7,
  },
  stat: {
    width: "50%",
    paddingVertical: 6,
    paddingRight: 6,
  },
  thirdStat: {
    width: "33.3333%",
  },
  statValue: {
    fontSize: 23,
    fontWeight: "700",
    color: "#111111",
  },
  compactStatValue: {
    fontSize: 18,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#777777",
  },
  continentGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  continentItem: {
    width: "50%",
    paddingVertical: 6,
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
    marginTop: 10,
  },
  regionRow: {
    minHeight: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  regionTextArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  regionAbbreviation: {
    width: 76,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#765FD2",
  },
  regionName: {
    flex: 1,
    fontSize: 11,
    color: "#888888",
  },
  regionCount: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  historyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },
  dots: {
    height: 22,
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
