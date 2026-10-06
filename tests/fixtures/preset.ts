import type { MapPreset } from "../../packages/core/src/index.js";

export const fixturePreset: MapPreset = {
  version: 1,
  map: {
    width: 640,
    height: 400,
    padding: 24,
    grid: "hex",
    spacing: 9,
    projection: { name: "equalEarth", center: { lat: 0, lng: 10 } },
    countries: ["AUT", "DEU"],
    region: { lat: [35, 60], lng: [0, 30] },
  },
  content: {
    pins: [
      {
        id: "vienna-hq",
        label: "Vienna HQ",
        lat: 48.2082,
        lng: 16.3738,
        group: "hq",
        color: "#00aabb",
        data: { office: 1 },
      },
      {
        id: "vienna-lab",
        label: "Vienna Lab",
        lat: 48.2083,
        lng: 16.3739,
        group: "labs",
        color: "#cc2244",
      },
      { id: "berlin", label: "Berlin", lat: 52.52, lng: 13.405, group: "hq" },
    ],
    groups: [
      { id: "hq", label: "Headquarters", color: "#007766" },
      { id: "labs", label: "Research labs", color: "#772233" },
    ],
    countryGroups: { AUT: ["hq", "labs"], DEU: "hq" },
    continentGroups: {},
    labels: { enabled: true, fontSize: 16, gap: 24, connector: "line" },
  },
  display: {
    hoverMode: "group",
    shape: "hexagon",
    showOcean: false,
    theme: {
      bg: "#ffeeaa",
      land: "#222222",
      dotSize: "3.25",
      pinSize: "5.5",
      labelSize: "16px",
      labelColor: "#332211",
      labelHalo: "#ffeeaa",
    },
  },
};
