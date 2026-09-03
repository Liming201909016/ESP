import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

interface Registry {
  status: string;
  skills: Array<{ code: string; name: string; version: string }>;
  plugins: Array<{ code: string; name: string; version: string; status: string }>;
}

function App() {
  const [registry, setRegistry] = useState<Registry | null>(null);

  useEffect(() => {
    fetch("/api/registry")
      .then((response) => response.json())
      .then(setRegistry);
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">ESP</div>
        <div>
          <p className="eyebrow">Microsoft Global Hackathon 2026</p>
          <h1>Enterprise Skill Platform</h1>
        </div>
        <span className="mode-badge">Demo Mode</span>
      </header>

      <section className="workspace" aria-labelledby="workspace-title">
        <div className="intro">
          <p className="section-label">Security Review Copilot</p>
          <h2 id="workspace-title">Trusted capabilities, composed on demand.</h2>
          <p>
            One Copilot routes each review through governed Skills, reusable Plugins,
            evidence, and human accountability.
          </p>
        </div>

        <div className="status-panel">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>Walking skeleton ready</strong>
            <p>Web experience and Skill Router API are available locally.</p>
          </div>
        </div>
      </section>

      <section className="catalog" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>
            <p className="section-label">Pinned registry</p>
            <h2 id="catalog-title">Five Skills. Four Plugins. One contract.</h2>
          </div>
          <span className="health-badge">{registry?.status ?? "loading"}</span>
        </div>

        <div className="catalog-grid">
          <div>
            <h3>Governed Skills</h3>
            <ul className="registry-list">
              {registry?.skills.map((skill) => (
                <li key={skill.code}>
                  <span><strong>{skill.name}</strong><small>{skill.code}</small></span>
                  <code>v{skill.version}</code>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Demo Plugins</h3>
            <ul className="registry-list">
              {registry?.plugins.map((plugin) => (
                <li key={plugin.code}>
                  <span><strong>{plugin.name}</strong><small>{plugin.code}</small></span>
                  <code>{plugin.status}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);