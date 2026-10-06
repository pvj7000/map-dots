import { createMap } from "@dotmap/core";
import { DotMap } from "@dotmap/react";
import world from "@dotmap/world";
import { memo, useMemo, useState, type ReactNode } from "react";

const REPOSITORY = "https://github.com/pvj7000/map-dots";
const examples = {
  react: `import { DotMap } from "@dotmap/toolkit/react";
import world from "@dotmap/toolkit/world";
import "@dotmap/toolkit/styles.css";

export function OfficeMap() {
  return (
    <DotMap
      geojson={world}
      projection="robinson"
      spacing={8}
      theme="paper"
      pins={[{ lat: 48.21, lng: 16.37, label: "Vienna" }]}
    />
  );
}`,
  html: `<!-- Copy toolkit/browser.js to your site assets -->
<script defer src="./assets/dotmap.js"></script>

<dot-map
  projection="robinson"
  spacing="8"
  theme="paper"
  hover-mode="country"
  pins='[{"lat":48.21,"lng":16.37,"label":"Vienna"}]'
></dot-map>`,
  core: `import { createMap } from "@dotmap/toolkit/core";
import world from "@dotmap/toolkit/world";

const map = createMap({
  geojson: world,
  projection: "robinson",
  spacing: 8,
});

const snapshot = map.compute({
  pins: [{ lat: 48.21, lng: 16.37, label: "Vienna" }],
});

// Render snapshot.dots in SVG, Canvas, or your own UI.
// Need an SVG string? Use renderSVG(snapshot) from @dotmap/toolkit/core.`,
};

function ArrowIcon({ external = false }: { external?: boolean }) {
  return (
    <svg
      className="arrow-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={external ? "M7 17 17 7M7 7h10v10" : "M5 12h14m-6-6 6 6-6 6"} />
    </svg>
  );
}

const HeroMap = memo(function HeroMap() {
  const snapshot = useMemo(
    () =>
      createMap({
        geojson: world,
        width: 1000,
        height: 580,
        padding: 18,
        spacing: 4.5,
        grid: "hex",
        projection: "naturalEarth",
      }).compute({
        groups: [{ id: "offices", label: "Our offices", color: "#28765e" }],
        countryGroups: {
          AUT: "offices",
          USA: "offices",
          SGP: "offices",
          ZAF: "offices",
        },
        pins: [
          {
            lat: 40.71,
            lng: -74,
            label: "New York",
            group: "offices",
            preferredAnchor: "left",
          },
          {
            lat: 48.21,
            lng: 16.37,
            label: "Vienna",
            group: "offices",
            preferredAnchor: "right",
          },
          {
            lat: 1.35,
            lng: 103.82,
            label: "Singapore",
            group: "offices",
            preferredAnchor: "left",
          },
          {
            lat: -33.92,
            lng: 18.42,
            label: "Cape Town",
            group: "offices",
            preferredAnchor: "right",
          },
        ],
        labels: { enabled: false },
      }),
    [],
  );

  return (
    <DotMap
      snapshot={snapshot}
      hoverMode="country"
      theme={{
        land: "#9cae9f",
        bg: "transparent",
        dotSize: "1.2",
        pinSize: "4",
      }}
    />
  );
});

export function ProductPage({ children }: { children: ReactNode }) {
  const [integration, setIntegration] =
    useState<keyof typeof examples>("react");
  const [copyStatus, setCopyStatus] = useState("");

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(examples[integration]);
      setCopyStatus("Example copied.");
    } catch {
      setCopyStatus("Select the example below to copy it.");
    }
  };

  return (
    <div className="product-page" id="top">
      <a className="skip-link" href="#customize">
        Skip to map customizer
      </a>
      <header className="site-header page-width">
        <a className="brand" href="#top" aria-label="DotMap home">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            dotmap<span className="brand-period">.</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#why-dotmap">Why DotMap</a>
          <a href="#customize">Customizer</a>
          <a href="#get-started">Get started</a>
        </nav>
        <a
          className="github-link"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ArrowIcon external />
        </a>
      </header>

      <main>
        <section className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <a
              className="hero-license"
              href={`${REPOSITORY}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
            >
              Open source · MIT licensed
            </a>
            <h1 id="hero-title">
              Dotted maps
              <br />
              <em>for your website.</em>
            </h1>
            <p className="hero-description">
              Design your map visually. Export it for React or HTML.
            </p>
            <div className="hero-actions">
              <a className="btn" href="#customize">
                Create your map <ArrowIcon />
              </a>
              <a
                className="btn btn--ghost"
                href={REPOSITORY}
                target="_blank"
                rel="noreferrer"
              >
                Explore the code <ArrowIcon external />
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <HeroMap />
          </div>
        </section>

        <div
          className="compatibility page-width"
          aria-label="Supported integrations"
        >
          <strong>React</strong>
          <strong>Web components</strong>
          <strong>TypeScript</strong>
          <strong>SVG + Canvas</strong>
        </div>

        <section
          className="why-section page-width"
          id="why-dotmap"
          aria-labelledby="why-title"
        >
          <div className="section-intro">
            <p className="eyebrow">Small dots. Big picture.</p>
            <h2 id="why-title">Put your world on the page.</h2>
            <p>
              For the moments when a map should tell your story: where your team
              works, where your customers are, or where you’re going next.
            </p>
          </div>
          <div className="feature-grid">
            <article>
              <div
                className="feature-icon feature-icon--pin"
                aria-hidden="true"
              >
                ◎
              </div>
              <h3>Give places a presence.</h3>
              <p>
                Add locations, highlight countries, or color entire continents.
                Pins snap to the grid, with labels that find their own space.
              </p>
            </article>
            <article>
              <div
                className="feature-icon feature-icon--dots"
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <h3>Make it feel like your site.</h3>
              <p>
                Choose a projection, grid, and palette. Preview your changes
                here, then take the same settings straight into your project.
              </p>
            </article>
            <article>
              <div className="feature-icon" aria-hidden="true">
                &lt;/&gt;
              </div>
              <h3>Build on your terms.</h3>
              <p>
                Use a React component, drop in a custom element, or render the
                data yourself. Typed, open source, and styled with CSS
                variables.
              </p>
            </article>
          </div>
        </section>

        {children}

        <section
          className="get-started page-width"
          id="get-started"
          aria-labelledby="get-started-title"
        >
          <div className="setup-copy">
            <p className="eyebrow">Your next commit</p>
            <h2 id="get-started-title">
              From dots to
              <br />a working map.
            </h2>
            <p>
              Create your map here, then use the HTML export or install the
              toolkit in your own project.
            </p>
            <ol className="setup-steps">
              <li>
                <span>01</span>
                <div>
                  <h3>Get the toolkit</h3>
                  <p>
                    Download your map as HTML to use it right away. For React,
                    install the packed beta while the first npm release is
                    prepared.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Find your look</h3>
                  <p>
                    Use the customizer above. Add your places, tune the details,
                    and download your preset.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Bring it to your site</h3>
                  <p>
                    Choose React or HTML for ready-to-use code, or JSON to keep
                    your configuration separate.
                  </p>
                </div>
              </li>
            </ol>
            <a
              className="inline-link"
              href={`${REPOSITORY}#readme`}
              target="_blank"
              rel="noreferrer"
            >
              Read the full documentation <ArrowIcon external />
            </a>
          </div>
          <div className="setup-code">
            <div className="terminal">
              <div>
                <span className="terminal-lights" aria-hidden="true">
                  ● ● ●
                </span>
                <span>Build the package from source</span>
              </div>
              <pre>
                <code>
                  git clone https://github.com/pvj7000/map-dots.git{"\n"}cd
                  map-dots{"\n"}npm install{"\n"}npm run pack:toolkit
                </code>
              </pre>
            </div>
            <div className="integration-code">
              <div
                className="integration-tabs"
                aria-label="Integration example"
              >
                {(["react", "html", "core"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={integration === item}
                    className={integration === item ? "is-on" : ""}
                    onClick={() => {
                      setIntegration(item);
                      setCopyStatus("");
                    }}
                  >
                    {item === "react"
                      ? "React"
                      : item === "html"
                        ? "Web component"
                        : "Headless"}
                  </button>
                ))}
                <button
                  className="example-copy"
                  type="button"
                  onClick={copyExample}
                >
                  Copy
                </button>
              </div>
              <pre
                tabIndex={0}
                aria-label={`${integration} integration example`}
              >
                <code>{examples[integration]}</code>
              </pre>
              <p role="status">
                {copyStatus ||
                  "React examples use the installable DotMap toolkit. HTML uses the standalone browser bundle."}
              </p>
            </div>
          </div>
        </section>

        <section className="open-source-banner page-width">
          <div>
            <p className="eyebrow">A shared little world</p>
            <h2>Open source, from the first dot.</h2>
            <p>
              Use it, change it, and help make it better. DotMap is free under
              the MIT license.
            </p>
          </div>
          <a
            className="btn btn--ghost"
            href={REPOSITORY}
            target="_blank"
            rel="noreferrer"
          >
            Explore on GitHub <ArrowIcon external />
          </a>
        </section>
      </main>
      <footer className="site-footer page-width">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true" />
          <span>dotmap.</span>
        </a>
        <p>A little toolkit for your place in the world.</p>
        <div>
          <a
            href={`${REPOSITORY}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
          >
            MIT license
          </a>
          <a href={`${REPOSITORY}#readme`} target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
      </footer>
    </div>
  );
}
