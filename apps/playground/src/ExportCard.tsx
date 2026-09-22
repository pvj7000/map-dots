import type {
  GridTopology,
  GroupDef,
  HoverMode,
  PinInput,
  ProjectionName,
} from "@dotmap/core";
import type { ThemePreset } from "@dotmap/theme";
import { useMemo, useState } from "react";
import type { ScopeId } from "./presence";

type ExportFormat = "json" | "react" | "html";

export interface ExportCardProps {
  pins: PinInput[];
  groups: GroupDef[];
  countryGroups: Record<string, string | string[]>;
  continentGroups: Record<string, string | string[]>;
  grid: GridTopology;
  projection: ProjectionName;
  spacing: number;
  scope: ScopeId;
  theme: ThemePreset;
  hoverMode: HoverMode;
}

export function ExportCard(props: ExportCardProps) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => exportSource(format, props), [format, props]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const extension = format === "json" ? "json" : format === "react" ? "tsx" : "html";
    const blob = new Blob([code], { type: format === "json" ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dotmap-config.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card code-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Ready to use</p>
          <h2>Export</h2>
        </div>
        <div className="code-actions">
          <button className="icon-btn" type="button" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button className="icon-btn" type="button" onClick={download}>Download</button>
        </div>
      </div>

      <div className="segment-control" aria-label="Export format">
        {(["json", "react", "html"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={format === item ? "is-on" : ""}
            onClick={() => setFormat(item)}
          >
            {item === "json" ? "JSON" : item === "react" ? "React" : "HTML"}
          </button>
        ))}
      </div>

      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </section>
  );
}

function exportSource(format: ExportFormat, props: ExportCardProps): string {
  const config = {
    map: {
      grid: props.grid,
      projection: props.projection,
      spacing: props.spacing,
      scope: props.scope,
      theme: props.theme,
      hoverMode: props.hoverMode,
    },
    pins: cleanPins(props.pins),
    groups: props.groups,
    countryGroups: props.countryGroups,
    continentGroups: props.continentGroups,
  };

  if (format === "json") return JSON.stringify(config, null, 2);

  const pins = JSON.stringify(cleanPins(props.pins), null, 2);
  const groups = JSON.stringify(props.groups, null, 2);
  const countryGroups = JSON.stringify(props.countryGroups, null, 2);
  const continentGroups = JSON.stringify(props.continentGroups, null, 2);
  const view =
    props.scope === "world"
      ? ""
      : `\n  ...continentView("${props.scope}"),`;

  if (format === "react") {
    return `import { continentView, createMap } from "@dotmap/core";
import { DotMap, Legend } from "@dotmap/react";
import world from "@dotmap/world";

const pins = ${pins};
const groups = ${groups};

const map = createMap({
  geojson: world,
  grid: "${props.grid}",
  projection: "${props.projection}",
  spacing: ${props.spacing},${view}
});

const snapshot = map.compute({
  pins,
  groups,
  countryGroups: ${countryGroups},
  continentGroups: ${continentGroups},
});

export function PresenceMap() {
  return (
    <>
      <DotMap snapshot={snapshot} theme="${props.theme}" hoverMode="${props.hoverMode}" />
      <Legend items={snapshot.legend} />
    </>
  );
}`;
  }

  return `<script type="module">
  import "@dotmap/element";

  const map = document.querySelector("#presence-map");
  map.pins = ${indentJson(pins, 2)};
  map.groups = ${indentJson(groups, 2)};
  map.countryGroups = ${indentJson(countryGroups, 2)};
  map.continentGroups = ${indentJson(continentGroups, 2)};
</script>

<dot-map
  id="presence-map"
  grid="${props.grid}"
  projection="${props.projection}"
  spacing="${props.spacing}"
  scope="${props.scope}"
  theme="${props.theme}"
  hover-mode="${props.hoverMode}"
></dot-map>`;
}

function cleanPins(pins: PinInput[]): PinInput[] {
  return pins.map((pin) =>
    Object.fromEntries(Object.entries(pin).filter(([, value]) => value !== undefined)) as unknown as PinInput,
  );
}

function indentJson(json: string, spaces: number): string {
  const indentation = " ".repeat(spaces);
  return json.replaceAll("\n", `\n${indentation}`);
}
