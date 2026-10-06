import type { MapPreset } from "@dotmap/core";
import { useEffect, useState } from "react";
import { exportSource, type ExportFormat } from "./export-source";

export function ExportCard({ preset }: { preset: MapPreset }) {
  const [format, setFormat] = useState<ExportFormat>("react");
  const [status, setStatus] = useState("");
  const bundleUrl = new URL(
    `${import.meta.env.BASE_URL}dotmap.js`,
    window.location.origin,
  ).href;
  const code = exportSource(format, preset, bundleUrl);
  useEffect(() => {
    setStatus("");
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus(
        "Clipboard unavailable. Select the code below or download the file.",
      );
    }
  };
  const download = () => {
    const extension =
      format === "json" ? "json" : format === "react" ? "tsx" : "html";
    const blob = new Blob([code], {
      type: format === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dotmap-preset.${extension}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Preset downloaded.");
  };

  return (
    <section className="card code-card" aria-label="Export your map">
      <div className="section-head">
        <div>
          <p className="section-kicker">From preview to production</p>
          <h3>Make it part of your site.</h3>
        </div>
      </div>
      <p className="panel-description">
        Your settings, locations, and colors are included. Pick the format that
        fits your project.
      </p>
      <div className="segment-control" aria-label="Export format">
        {(["react", "html", "json"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={format === item}
            className={format === item ? "is-on" : ""}
            onClick={() => setFormat(item)}
          >
            {item === "json"
              ? "JSON preset"
              : item === "react"
                ? "React"
                : "HTML"}
          </button>
        ))}
      </div>
      <p className="export-hint">
        {format === "react"
          ? "Save as CustomMap.tsx in a React project using the DotMap toolkit."
          : format === "html"
            ? "Open this HTML page or host it on your site. It loads the standalone browser bundle from this customizer."
            : "Reuse with createMap({ geojson: world, ...preset.map }), compute(preset.content), and preset.display."}
      </p>
      <div className="export-actions">
        <button className="btn btn--small" type="button" onClick={copy}>
          Copy code <span aria-hidden="true">↗︎</span>
        </button>
        <button
          className="btn btn--small btn--ghost"
          type="button"
          onClick={download}
        >
          Download preset <span aria-hidden="true">↓</span>
        </button>
      </div>
      <p className="copy-status" role="status">
        {status}
      </p>
      <pre tabIndex={0} aria-label={`${format} export code`}>
        <code>{code}</code>
      </pre>
      <a className="inline-link" href="#get-started">
        View setup instructions <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
