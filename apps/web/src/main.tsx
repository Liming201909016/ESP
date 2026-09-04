import { StrictMode, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

import "./styles.css";

interface Registry {
  status: string;
  skills: Array<{ code: string; name: string; version: string }>;
  plugins: Array<{ code: string; name: string; version: string; status: string }>;
}

interface EvaluationSummary {
  status: string;
  caseCount: number;
  passedCaseCount: number;
  mandatoryAssertionCount: number;
  passedMandatoryAssertionCount: number;
  pilotEligible: boolean;
  pilotBlockers: string[];
}

interface ReviewResult {
  correlationId: string;
  caseId: string;
  consumer: { code: string; name: string };
  consumerBinding: { code: string; status: string };
  state: string;
  outcome: string;
  proposedRisk?: string;
  missingInformation?: string[];
  evidence: Array<{ evidenceId: string; type: string; sourceId: string; claimReference: string }>;
  trace: Array<{ sequence: number; skillCode: string; skillVersion: string; implementationVersion: string; pluginCodes: string[]; outcome: string }>;
  safety?: { promptInjectionDetected: boolean; promptInjectionIgnored: boolean; governanceOverrideAllowed: boolean };
  report?: {
    reportId: string;
    status: string;
    templateVersion: string;
    title: string;
    summary: string;
    scope: string;
    runbookCode: string;
    findings: Array<{ findingId: string; statement: string; citations: Array<{ evidenceId: string; sourceId: string; claimReference: string }> }>;
    citationsPreserved: boolean;
  };
  analystReviewRequired?: boolean;
  analystDisposition?: { decision: string; rationale: string; finalRisk?: string };
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();
  if (!response.ok) {
    let detail = "";
    try {
      detail = (JSON.parse(text) as { error?: string }).error ?? "";
    } catch {
      detail = text;
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("The service returned an invalid response.");
  }
}

function App() {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationSummary | null>(null);
  const [caseId, setCaseId] = useState("SYN-RG-001");
  const [requestText, setRequestText] = useState("Review this package and produce an evidence-grounded draft.");
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [running, setRunning] = useState(false);
  const [analystRationale, setAnalystRationale] = useState("Reviewed against the cited evidence and synthetic Runbook.");
  const [finalRisk, setFinalRisk] = useState("Medium");
  const [dispositionRunning, setDispositionRunning] = useState(false);
  const [startupError, setStartupError] = useState("");
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setStartupError("");
    try {
      const [nextRegistry, nextEvaluation] = await Promise.all([
        fetchJson<Registry>("/api/registry"),
        fetchJson<EvaluationSummary>("/api/evaluation/summary"),
      ]);
      setRegistry(nextRegistry);
      setEvaluation(nextEvaluation);
    } catch (error) {
      setStartupError(error instanceof Error ? error.message : "Unable to load Demo status.");
    }
  }

  async function runReview() {
    setRunning(true);
    setReviewError("");
    try {
      const result = await fetchJson<ReviewResult>("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, request: requestText, consumerBindingCode: "CB-ESP-DEMO-001" }),
      });
      setReview(result);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to run the review.");
    } finally {
      setRunning(false);
    }
  }

  async function submitDisposition(decision: string) {
    if (!review) return;
    setDispositionRunning(true);
    setReviewError("");
    try {
      const result = await fetchJson<ReviewResult>(`/api/reviews/${review.correlationId}/disposition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, rationale: analystRationale, finalRisk }),
      });
      setReview(result);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to save the analyst disposition.");
    } finally {
      setDispositionRunning(false);
    }
  }

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

        <div className={`status-panel${startupError ? " error-panel" : ""}`} role={startupError ? "alert" : undefined}>
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{startupError ? "Demo status unavailable" : "Demo workflow ready"}</strong>
            <p>{startupError || "Four governed scenarios, analyst review, reports, traces, and evaluation run locally."}</p>
            {startupError ? <button type="button" onClick={loadDashboard}>Retry status</button> : null}
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

      <section className="review-console" aria-labelledby="review-title">
        <div className="review-controls">
          <div>
            <p className="section-label">Copilot entry</p>
            <h2 id="review-title">Run a governed review</h2>
            <p>Select an included synthetic package. No tenant, secret, or network integration is used.</p>
          </div>

          <label>
            Synthetic package
            <select value={caseId} onChange={(event) => setCaseId(event.target.value)}>
              <option value="SYN-RG-001">RG happy path</option>
              <option value="SYN-RG-002">RG missing information</option>
              <option value="SYN-APP-001">APP happy path</option>
              <option value="SYN-APP-002">APP prompt injection</option>
            </select>
          </label>

          <label>
            Request
            <textarea value={requestText} onChange={(event) => setRequestText(event.target.value)} rows={4} />
          </label>

          <button type="button" onClick={runReview} disabled={running}>
            {running ? "Running review..." : "Run review"}
          </button>
        </div>

        <div className="review-output" aria-live="polite">
          {reviewError ? (
            <div className="result-block error-panel" role="alert">
              <h3>Request failed</h3>
              <p>{reviewError}</p>
              <button type="button" onClick={runReview} disabled={running}>Retry review</button>
            </div>
          ) : null}
          {!review ? (
            <div className="empty-state"><span>Awaiting request</span><p>The ordered Skill trace and evidence will appear here.</p></div>
          ) : (
            <>
              <div className="result-summary">
                <span className="outcome">{review.outcome}</span>
                <div>
                  <strong>{review.state}</strong>
                  <small>{review.consumer.name} · {review.consumerBinding.code} ({review.consumerBinding.status})</small>
                  <small>Correlation {review.correlationId}</small>
                </div>
              </div>
              {review.missingInformation?.length ? <div className="result-block"><h3>Needs information</h3><p>{review.missingInformation.join(", ")}</p></div> : null}
              {review.proposedRisk ? <div className="result-block"><h3>Proposed risk</h3><p>{review.proposedRisk} · analyst confirmation required</p></div> : null}
              {review.safety?.promptInjectionDetected ? (
                <div className="result-block safety-result">
                  <h3>Safety control</h3>
                  <p>Prompt injection detected and ignored. Governance remained authoritative.</p>
                </div>
              ) : null}
              <div className="result-block">
                <h3>Execution trace</h3>
                <ol className="trace-list">
                  {review.trace.map((entry) => (
                    <li key={entry.sequence}><span>{entry.skillCode}</span><small>Skill v{entry.skillVersion} · Implementation {entry.implementationVersion} · {entry.pluginCodes.join(" + ")} · {entry.outcome}</small></li>
                  ))}
                </ol>
              </div>
              <div className="result-block">
                <h3>Evidence · {review.evidence.length} items</h3>
                {review.evidence.length ? (
                  <ul className="evidence-list">
                    {review.evidence.map((item) => (
                      <li key={item.evidenceId}>
                        <strong>{item.type}</strong>
                        <span>{item.claimReference}</span>
                        <small>Source {item.sourceId}</small>
                      </li>
                    ))}
                  </ul>
                ) : <p>No evidence emitted before the governed stop.</p>}
              </div>
              {review.state === "AwaitingAnalystDisposition" ? (
                <div className="analyst-panel">
                  <h3>Analyst disposition</h3>
                  <label>
                    Final risk
                    <select value={finalRisk} onChange={(event) => setFinalRisk(event.target.value)}>
                      {['Blocker', 'High', 'Medium', 'Low', 'Info', 'Unrated'].map((risk) => <option key={risk}>{risk}</option>)}
                    </select>
                  </label>
                  <label>
                    Rationale
                    <textarea value={analystRationale} onChange={(event) => setAnalystRationale(event.target.value)} rows={3} />
                  </label>
                  <div className="decision-actions">
                    {['Accept', 'Modify', 'Reject', 'Escalate', 'CannotAssess'].map((decision) => (
                      <button key={decision} type="button" disabled={dispositionRunning} onClick={() => submitDisposition(decision)}>
                        {decision === 'CannotAssess' ? 'Cannot assess' : decision}
                      </button>
                    ))}
                  </div>
                </div>
              ) : review.analystDisposition ? (
                <div className="analyst-panel completed-disposition">
                  <h3>Human decision retained</h3>
                  <p><strong>{review.analystDisposition.decision}</strong> · {review.analystDisposition.rationale}</p>
                  <p>Final risk: {review.analystDisposition.finalRisk ?? "Not assigned"} · Report: {review.report?.status}</p>
                </div>
              ) : null}
              {review.report ? (
                <article className="report-preview" aria-labelledby="report-title">
                  <div className="report-heading">
                    <div><p>Security Review Report</p><h3 id="report-title">{review.report.title}</h3></div>
                    <span>{review.report.status}</span>
                  </div>
                  <p>{review.report.summary}</p>
                  <dl>
                    <div><dt>Report</dt><dd>{review.report.reportId}</dd></div>
                    <div><dt>Runbook</dt><dd>{review.report.runbookCode}</dd></div>
                    <div><dt>Template</dt><dd>v{review.report.templateVersion}</dd></div>
                    <div><dt>Citations</dt><dd>{review.report.citationsPreserved ? "Preserved" : "Missing"}</dd></div>
                  </dl>
                  <h4>Scope</h4>
                  <p>{review.report.scope}</p>
                  <h4>Findings</h4>
                  {review.report.findings.map((finding) => (
                    <section key={finding.findingId} className="report-finding">
                      <strong>{finding.findingId}</strong>
                      <p>{finding.statement}</p>
                      <ul>{finding.citations.map((citation) => <li key={citation.evidenceId}>[{citation.claimReference}] {citation.sourceId}</li>)}</ul>
                    </section>
                  ))}
                </article>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="evaluation-band" aria-labelledby="evaluation-title">
        <div>
          <p className="section-label">Independent evaluation</p>
          <h2 id="evaluation-title">{evaluation?.status ?? "Evaluating application"}</h2>
          <p>Application results are exported to the existing Python acceptance oracle.</p>
        </div>
        <dl>
          <div><dt>Scenarios</dt><dd>{evaluation ? `${evaluation.passedCaseCount}/${evaluation.caseCount}` : "—"}</dd></div>
          <div><dt>Assertions</dt><dd>{evaluation ? `${evaluation.passedMandatoryAssertionCount}/${evaluation.mandatoryAssertionCount}` : "—"}</dd></div>
          <div><dt>Pilot eligible</dt><dd>{evaluation?.pilotEligible ? "Yes" : "No"}</dd></div>
        </dl>
        {evaluation?.pilotBlockers?.length ? <p className="evaluation-note">{evaluation.pilotBlockers.join(" · ")}</p> : null}
      </section>
    </main>
  );
}

const runtime = globalThis as typeof globalThis & { __espRoot?: Root };
runtime.__espRoot ??= createRoot(document.getElementById("root")!);
runtime.__espRoot.render(
  <StrictMode>
    <App />
  </StrictMode>,
);