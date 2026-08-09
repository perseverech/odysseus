import React from "react";
import Svg, { Path } from "react-native-svg";

const worldModule = require("@svg-maps/world");
const WORLD_MAP = worldModule.default ?? worldModule;

export type MapLocation = {
  id: string;
  name: string;
  path: string;
};

type Props = {
  visitedCountries: string[];
  selectedCountry: MapLocation | null;
  onSelectCountry: (country: MapLocation) => void;
};

const COLORS = {
  visited: "#C8B5FF",
  unvisited: "#F5F5F7",

  // Одинаковая граница для ВСЕХ стран
  border: "#D8D8DE",

  // Выбранная страна выделяется фиолетовой линией,
  // но НЕ становится "visited"
  selectedBorder: "#8F72E8",
};

export default function MapSvg({
  visitedCountries,
  selectedCountry,
  onSelectCountry,
}: Props) {
  const normalizedVisited = visitedCountries.map((id) =>
    id.toLowerCase()
  );

  const isVisited = (id: string) =>
    normalizedVisited.includes(id.toLowerCase());

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={WORLD_MAP.viewBox}
      preserveAspectRatio="xMidYMid meet"
    >
      {WORLD_MAP.locations.map((country: MapLocation) => {
        const visited = isVisited(country.id);
        const selected = selectedCountry?.id === country.id;

        return (
          <Path
            key={country.id}
            d={country.path}
            fill={visited ? COLORS.visited : COLORS.unvisited}
            stroke={
              selected
                ? COLORS.selectedBorder
                : COLORS.border
            }
            strokeWidth={selected ? 1.4 : 0.55}
            strokeLinejoin="round"
            strokeLinecap="round"
            onPress={() => onSelectCountry(country)}
          />
        );
      })}
    </Svg>
  );
}