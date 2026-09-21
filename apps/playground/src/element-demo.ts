import "@dotmap/element";
import { countryGroups, groups, pins } from "./presence";

const map = document.querySelector("dot-map");
if (map) {
  Object.assign(map, { pins, groups, countryGroups });
}
