import { StrictMode, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

import "./styles.css";

interface Registry {
  status: string;
  skills: Array<{ code: string; name: string; version: string }>;
  plugins: Array<{ code: string; name: string; version: string; status: string }>;
}

interface EvaluationRun {
  runId: string;
  status: string;
  pins: {
    logicalSkillVersion: string;
    implementationVersion: string;
    packageVersion: string;
    dependencySnapshotHash: string;
    deploymentCode: string;
    consumerBindingCode: string;
    evaluatorVersion: string;
    runtimeConfigurationHash: string;
    thresholdVersion: string;
  };
  caseResults: Array<{
    caseId: string;
    requestType: string;
    category: string;
    passed: boolean;
    assertions: Array<{ name: string; mandatory: boolean; passed: boolean; detail: string }>;
  }>;
  aggregateMeasures: {
    caseCount: number;
    passedCaseCount: number;
    mandatoryAssertionCount: number;
    passedMandatoryAssertionCount: number;
    mandatoryAssertionPassRate: number;
  };
  decision: {
    foundationStatus: string;
    pilotGateEligible: boolean;
    pilotBlockers: string[];
  };
  evaluator: string;
}

interface IntentResolution {
  resolutionId: string;
  intent: {
    raw: string;
    normalized: string;
    domain: "SecurityReview" | "Unclassified";
    objective: string;
    inferredRequestType: "RG" | "APP" | null;
    inferredCategory: string;
    signals: string[];
    confidence: number;
    selectionBasis: "EmployeeIntent" | "EvidenceContext";
  };
  evidenceContext: {
    caseId: string;
    requestType: "RG" | "APP";
    category: string;
    projectDescription: string;
    contextMatchesIntent: boolean;
  };
  discovery: {
    candidateCount: number;
    selectedCount: number;
    candidates: Array<{
      skillCode: string;
      name: string;
      version: string;
      implementationVersion: string;
      pluginCodes: string[];
      oversight: string;
      decision: "Authorized" | "Blocked";
      workflowSelected: boolean;
      selectionReason: string;
    }>;
    pluginCodes: string[];
  };
  authorization: {
    bindingCode: string;
    consumerCode: string;
    consumerName: string;
    status: string;
    allSelectedSkillsAuthorized: boolean;
    blockedSkillCodes: string[];
  };
  governance: {
    evidenceRequired: boolean;
    evaluationRequired: boolean;
    humanDecisionRequired: boolean;
    autonomousApprovalAllowed: boolean;
  };
  outcome: {
    requestedType: "Knowledge" | "Service" | "Action";
    authorizedType: "Knowledge";
    actionAllowed: boolean;
    title: string;
    reason: string;
  };
  requiresConfirmation: boolean;
  confirmationReason: string | null;
}

interface ReviewResult {
  correlationId: string;
  caseId: string;
  request?: { text: string };
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
  lineage: {
    resolutionId: string;
    status: "Partial" | "Complete";
    selectedSkillCodes: string[];
    executedSkillCodes: string[];
    evidenceIds: string[];
    citationEvidenceIds: string[];
    humanDecisionEvidenceId?: string;
    reconciled: {
      selectedSkillsExecuted: boolean;
      citationsResolveToEvidence: boolean;
      humanDecisionRetained: boolean;
      outcomeConstrained: boolean;
    };
  };
}

interface RecentReviewSummary {
  correlationId: string;
  caseId: string | null;
  state: string | null;
  outcome: string | null;
  updatedAt: string | null;
  consumerBindingCode: string | null;
  reportStatus: string | null;
  analystDecision: string | null;
  proposedRisk: string | null;
  finalRisk: string | null;
  traceCount: number;
  evidenceCount: number;
  lineageStatus: string | null;
}

interface DocumentIntakeInvocation {
  contractVersion: string;
  correlationId: string;
  invocationId: string;
  consumer: { code: string; name: string; type: "Copilot" | "Workflow" };
  consumerBinding: { code: string; status: string };
  skill: { code: string; version: string; implementationVersion: string };
  pluginInvocations: Array<{
    invocationId: string;
    pluginCode: string;
    pluginVersion: string;
    mode: "Demo";
    outcome: string;
    evidenceIds: string[];
  }>;
  outcome: string;
  payload: { materialComplete: boolean; sourceIds: string[]; dataGaps: string[] };
  evidence: Array<{ evidenceId: string; type: string; sourceId: string; claimReference: string }>;
  oversight: string;
  errors: Array<{ category: string; message: string; retryable: boolean }>;
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
  const [evaluation, setEvaluation] = useState<EvaluationRun | null>(null);
  const [caseId, setCaseId] = useState("SYN-RG-001");
  const [requestText, setRequestText] = useState("Review this package and produce an evidence-grounded draft.");
  const [intentResolution, setIntentResolution] = useState<IntentResolution | null>(null);
  const [selectedSkillCode, setSelectedSkillCode] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [running, setRunning] = useState(false);
  const [analystRationale, setAnalystRationale] = useState("Reviewed against the cited evidence and synthetic Runbook.");
  const [finalRisk, setFinalRisk] = useState("Medium");
  const [dispositionRunning, setDispositionRunning] = useState(false);
  const [startupError, setStartupError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [recentReviews, setRecentReviews] = useState<RecentReviewSummary[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState("");
  const [openingReviewId, setOpeningReviewId] = useState<string | null>(null);
  const [reuseProof, setReuseProof] = useState<DocumentIntakeInvocation[]>([]);
  const [reuseRunning, setReuseRunning] = useState(false);
  const [reuseError, setReuseError] = useState("");

  useEffect(() => {
    void loadDashboard();
    void loadRecentReviews();
  }, []);

  async function loadDashboard() {
    setStartupError("");
    try {
      const [nextRegistry, nextEvaluation] = await Promise.all([
        fetchJson<Registry>("/api/registry"),
        fetchJson<EvaluationRun>("/api/evaluation/run"),
      ]);
      setRegistry(nextRegistry);
      setEvaluation(nextEvaluation);
    } catch (error) {
      setStartupError(error instanceof Error ? error.message : "Unable to load Demo status.");
    }
  }

  async function loadRecentReviews() {
    setRecentLoading(true);
    setRecentError("");
    try {
      const result = await fetchJson<{ reviews: RecentReviewSummary[] }>("/api/reviews?limit=8");
      setRecentReviews(result.reviews);
    } catch (error) {
      setRecentError(error instanceof Error ? error.message : "Unable to load recent reviews.");
    } finally {
      setRecentLoading(false);
    }
  }

  async function runReview() {
    setRunning(true);
    setReviewError("");
    try {
      const resolution = intentResolution ?? await discoverIntent();
      if (!resolution || resolution.requiresConfirmation) {
        setReview(null);
        return;
      }
      const result = await fetchJson<ReviewResult>("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId,
          request: requestText,
          consumerBindingCode: "CB-ESP-DEMO-001",
          resolutionId: resolution.resolutionId,
        }),
      });
      setReview(result);
      setSelectedEvidenceId(result.lineage.citationEvidenceIds[0] ?? result.lineage.evidenceIds[0] ?? null);
      void loadRecentReviews();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to run the review.");
    } finally {
      setRunning(false);
    }
  }

  async function discoverIntent() {
    setDiscovering(true);
    setReviewError("");
    try {
      const result = await fetchJson<IntentResolution>("/api/intent-resolutions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ employeeIntent: requestText, evidencePackageId: caseId, consumerBindingCode: "CB-ESP-DEMO-001" }),
      });
      setIntentResolution(result);
      setSelectedSkillCode(result.discovery.candidates[0]?.skillCode ?? null);
      return result;
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to discover a governed path.");
      return null;
    } finally {
      setDiscovering(false);
    }
  }

  function resetDiscovery() {
    setIntentResolution(null);
    setSelectedSkillCode(null);
    setSelectedEvidenceId(null);
    setReview(null);
    setReviewError("");
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
      void loadRecentReviews();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to save the analyst disposition.");
    } finally {
      setDispositionRunning(false);
    }
  }

  async function openRecentReview(correlationId: string) {
    setOpeningReviewId(correlationId);
    setReviewError("");
    try {
      const result = await fetchJson<ReviewResult>(`/api/reviews/${correlationId}`);
      setIntentResolution(null);
      setSelectedSkillCode(null);
      setReview(result);
      setCaseId(result.caseId);
      if (result.request?.text) setRequestText(result.request.text);
      setSelectedEvidenceId(result.lineage.citationEvidenceIds[0] ?? result.lineage.evidenceIds[0] ?? null);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to reopen the review.");
    } finally {
      setOpeningReviewId(null);
    }
  }

  async function runReuseProof() {
    setReuseRunning(true);
    setReuseError("");
    try {
      const invoke = (consumerBindingCode: string) => fetchJson<DocumentIntakeInvocation>("/api/skill-invocations/document-intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, request: requestText, consumerBindingCode }),
      });
      setReuseProof(await Promise.all([invoke("CB-ESP-DEMO-001"), invoke("CB-ARCH-DEMO-001")]));
    } catch (error) {
      setReuseError(error instanceof Error ? error.message : "Unable to prove governed reuse.");
    } finally {
      setReuseRunning(false);
    }
  }

  function formatUpdatedAt(value: string | null) {
    if (!value) return "Unknown time";
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? "Unknown time" : parsed.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
  }

  function formatState(value: string | null) {
    if (!value) return "Unknown";
    return value.replace(/([a-z])([A-Z])/g, "$1 $2");
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

      <section className="reuse-proof" aria-labelledby="reuse-title">
        <div className="reuse-heading">
          <div>
            <p className="section-label">Governed reuse proof</p>
            <h2 id="reuse-title">One Skill, two Consumers.</h2>
            <p>Each Consumer receives its own invocation identity through a distinct Binding while resolving the same pinned Skill and Plugin versions.</p>
          </div>
          <button type="button" onClick={() => void runReuseProof()} disabled={reuseRunning}>
            {reuseRunning ? "Invoking both..." : "Prove governed reuse"}
          </button>
        </div>
        {reuseError ? <p className="reuse-error" role="alert">{reuseError}</p> : null}
        {reuseProof.length === 2 ? (
          <div className="reuse-comparison">
            {reuseProof.map((invocation, index) => (
              <div key={invocation.consumerBinding.code} className="reuse-consumer">
                <span>{invocation.consumer.type}</span>
                <h3>{invocation.consumer.name}</h3>
                <code>{invocation.consumerBinding.code}</code>
                <dl>
                  <div><dt>Invocation</dt><dd>{invocation.invocationId.slice(0, 16)}</dd></div>
                  <div><dt>Outcome</dt><dd>{invocation.outcome}</dd></div>
                  <div><dt>Evidence</dt><dd>{invocation.evidence.length} retained</dd></div>
                </dl>
                <small>Correlation {invocation.correlationId}</small>
                {index === 0 ? null : <span className="visually-hidden">Second governed Consumer</span>}
              </div>
            ))}
            <div className="shared-asset">
              <span>Same pinned asset</span>
              <strong>{reuseProof[0].skill.code}</strong>
              <code>Skill v{reuseProof[0].skill.version}</code>
              <code>Implementation {reuseProof[0].skill.implementationVersion}</code>
              <ul>
                {reuseProof[0].pluginInvocations.map((plugin) => (
                  <li key={plugin.pluginCode}>{plugin.pluginCode} v{plugin.pluginVersion}</li>
                ))}
              </ul>
              <small>No copied implementation</small>
            </div>
          </div>
        ) : (
          <div className="reuse-empty">
            <span>Security Review Copilot</span>
            <strong>LS-SEC-DOC-INTAKE</strong>
            <span>Architecture Review Workflow</span>
          </div>
        )}
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
            <select value={caseId} onChange={(event) => { setCaseId(event.target.value); resetDiscovery(); }}>
              <option value="SYN-RG-001">RG happy path</option>
              <option value="SYN-RG-002">RG missing information</option>
              <option value="SYN-APP-001">APP happy path</option>
              <option value="SYN-APP-002">APP prompt injection</option>
            </select>
          </label>

          <label>
            Request
            <textarea value={requestText} onChange={(event) => { setRequestText(event.target.value); resetDiscovery(); }} rows={4} />
          </label>

          <div className="primary-actions">
            <button type="button" className="secondary-action" onClick={() => void discoverIntent()} disabled={discovering || running}>
              {discovering ? "Discovering..." : "Discover governed path"}
            </button>
            <button type="button" onClick={runReview} disabled={running || discovering || intentResolution?.requiresConfirmation === true}>
            {running ? "Running review..." : "Run review"}
            </button>
          </div>

          <section className="recent-reviews" aria-labelledby="recent-reviews-title">
            <div className="recent-heading">
              <div>
                <p className="section-label">Persistent work queue</p>
                <h3 id="recent-reviews-title">Recent reviews</h3>
              </div>
              <button type="button" className="refresh-reviews" onClick={() => void loadRecentReviews()} disabled={recentLoading}>
                Refresh
              </button>
            </div>
            {recentError ? <p className="recent-error" role="alert">{recentError}</p> : null}
            {recentLoading && recentReviews.length === 0 ? <p className="recent-empty">Loading retained reviews...</p> : null}
            {!recentLoading && recentReviews.length === 0 && !recentError ? <p className="recent-empty">No retained reviews yet.</p> : null}
            <div className="recent-list">
              {recentReviews.map((item) => (
                <button
                  type="button"
                  key={item.correlationId}
                  data-correlation-id={item.correlationId}
                  className={`recent-review-item${review?.correlationId === item.correlationId ? " selected" : ""}`}
                  onClick={() => void openRecentReview(item.correlationId)}
                  disabled={openingReviewId === item.correlationId}
                  aria-current={review?.correlationId === item.correlationId ? "true" : undefined}
                >
                  <span className="recent-state">{formatState(item.state)}</span>
                  <strong>{item.caseId ?? "Unknown case"}</strong>
                  <small>{item.reportStatus ?? "No report"} · {item.analystDecision ?? "Decision pending"}</small>
                  <small>{item.finalRisk ?? item.proposedRisk ?? "No risk"} · {item.traceCount} Skill{item.traceCount === 1 ? "" : "s"} · {item.evidenceCount} Evidence</small>
                  <span className="recent-meta"><code>{item.correlationId.slice(0, 8)}</code><time dateTime={item.updatedAt ?? undefined}>{formatUpdatedAt(item.updatedAt)}</time></span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="review-output" aria-live="polite">
          {reviewError ? (
            <div className="result-block error-panel" role="alert">
              <h3>Request failed</h3>
              <p>{reviewError}</p>
              <button type="button" onClick={runReview} disabled={running}>Retry review</button>
            </div>
          ) : null}
          {intentResolution ? (
            <section className="decision-center" aria-labelledby="decision-center-title">
              <div className="decision-center-heading">
                <div>
                  <p className="section-label">Intent and Skill discovery</p>
                  <h3 id="decision-center-title">Governed execution path</h3>
                </div>
                <span className={intentResolution.requiresConfirmation ? "resolution-badge warning" : "resolution-badge"}>
                  {intentResolution.requiresConfirmation ? "Confirm context" : `${Math.round(intentResolution.intent.confidence * 100)}% match`}
                </span>
              </div>

              <ol className="governed-path" aria-label="Governed enterprise outcome path">
                <li><span>1</span><strong>Employee intent</strong><small>{intentResolution.intent.normalized}</small></li>
                <li><span>2</span><strong>Intent understanding</strong><small>{intentResolution.intent.objective} · {intentResolution.intent.inferredRequestType ?? "context inferred"}</small></li>
                <li><span>3</span><strong>Skill discovery</strong><small>{intentResolution.discovery.selectedCount}/{intentResolution.discovery.candidateCount} authorized candidates</small></li>
                <li><span>4</span><strong>Governed Skills</strong><small>{intentResolution.authorization.bindingCode} · {intentResolution.authorization.status}</small></li>
                <li><span>5</span><strong>Reusable Plugins</strong><small>{intentResolution.discovery.pluginCodes.length} adapters selected</small></li>
                <li><span>6</span><strong>Enterprise outcome</strong><small>{intentResolution.outcome.authorizedType} · human accountable</small></li>
              </ol>

              {intentResolution.requiresConfirmation ? (
                <div className="resolution-warning" role="alert">
                  <strong>Execution paused</strong>
                  <p>{intentResolution.confirmationReason}</p>
                </div>
              ) : null}

              <div className="discovery-layout">
                <div>
                  <h4>Discovered Skills</h4>
                  <div className="skill-candidates">
                    {intentResolution.discovery.candidates.map((candidate) => (
                      <button
                        type="button"
                        key={candidate.skillCode}
                        className={selectedSkillCode === candidate.skillCode ? "selected" : ""}
                        onClick={() => setSelectedSkillCode(candidate.skillCode)}
                        aria-pressed={selectedSkillCode === candidate.skillCode}
                      >
                        <span>{candidate.name}</span>
                        <small>{candidate.workflowSelected ? "Selected" : "Not selected"} · {candidate.decision} · {candidate.oversight}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="skill-inspector">
                  {intentResolution.discovery.candidates.filter((candidate) => candidate.skillCode === selectedSkillCode).map((candidate) => (
                    <div key={candidate.skillCode}>
                      <span className="decision-state">{candidate.decision}</span>
                      <h4>{candidate.name}</h4>
                      <code>{candidate.skillCode} · v{candidate.version}</code>
                      <p>{candidate.selectionReason}</p>
                      <dl>
                        <div><dt>Implementation</dt><dd>{candidate.implementationVersion}</dd></div>
                        <div><dt>Plugins</dt><dd>{candidate.pluginCodes.join(" + ")}</dd></div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>

              <div className="outcome-contract">
                <div><span>Requested</span><strong>{intentResolution.outcome.requestedType}</strong></div>
                <div><span>Authorized</span><strong>{intentResolution.outcome.authorizedType}</strong></div>
                <p>{intentResolution.outcome.reason}</p>
              </div>
            </section>
          ) : null}
          {!review ? (
            !intentResolution ? <div className="empty-state"><span>Awaiting intent</span><p>Discover the governed Skill path, then execute the evidence-grounded review.</p></div> : null
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
              <section className="decision-lineage" aria-labelledby="lineage-title">
                <div className="lineage-heading">
                  <div>
                    <p className="section-label">Decision lineage</p>
                    <h3 id="lineage-title">From selected capability to accountable outcome</h3>
                  </div>
                  <span className={`lineage-status ${review.lineage.status.toLowerCase()}`}>{review.lineage.status}</span>
                </div>
                <ol className="lineage-chain">
                  <li className={review.lineage.reconciled.selectedSkillsExecuted ? "verified" : "partial"}>
                    <span>Discover</span>
                    <strong>{review.lineage.selectedSkillCodes.length} selected</strong>
                    <small>{review.lineage.resolutionId}</small>
                  </li>
                  <li className={review.lineage.reconciled.selectedSkillsExecuted ? "verified" : "partial"}>
                    <span>Execute</span>
                    <strong>{review.lineage.executedSkillCodes.length}/{review.lineage.selectedSkillCodes.length} Skills</strong>
                    <small>{review.lineage.reconciled.selectedSkillsExecuted ? "Selection reconciled" : "Governed partial stop"}</small>
                  </li>
                  <li className={review.lineage.evidenceIds.length ? "verified" : "partial"}>
                    <span>Evidence</span>
                    <strong>{review.lineage.evidenceIds.length} retained</strong>
                    <small>Facts, rules, tools, model, human</small>
                  </li>
                  <li className={review.lineage.reconciled.citationsResolveToEvidence ? "verified" : "partial"}>
                    <span>Citations</span>
                    <strong>{review.lineage.citationEvidenceIds.length} resolved</strong>
                    <small>{review.lineage.reconciled.citationsResolveToEvidence ? "All references retained" : "No report at governed stop"}</small>
                  </li>
                  <li className={review.lineage.reconciled.humanDecisionRetained ? "verified" : "pending"}>
                    <span>Human</span>
                    <strong>{review.lineage.reconciled.humanDecisionRetained ? review.analystDisposition?.decision : "Pending"}</strong>
                    <small>{review.lineage.humanDecisionEvidenceId ?? "Decision required"}</small>
                  </li>
                  <li className={review.lineage.reconciled.outcomeConstrained ? "verified" : "partial"}>
                    <span>Outcome</span>
                    <strong>{review.report?.status ?? review.outcome}</strong>
                    <small>{review.lineage.reconciled.outcomeConstrained ? "Policy constrained" : "Review required"}</small>
                  </li>
                </ol>
                {review.report?.findings.length ? (
                  <div className="lineage-citations">
                    <h4>Finding citations</h4>
                    {review.report.findings.flatMap((finding) => finding.citations.map((citation) => (
                      <button
                        type="button"
                        key={`${finding.findingId}-${citation.evidenceId}`}
                        className={selectedEvidenceId === citation.evidenceId ? "selected" : ""}
                        onClick={() => setSelectedEvidenceId(citation.evidenceId)}
                      >
                        <strong>{finding.findingId}</strong>
                        <span>{citation.claimReference}</span>
                        <small>{citation.evidenceId}</small>
                      </button>
                    )))}
                  </div>
                ) : null}
              </section>
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
                      <li key={item.evidenceId} className={selectedEvidenceId === item.evidenceId ? "selected" : ""}>
                        <button type="button" onClick={() => setSelectedEvidenceId(item.evidenceId)}>
                          <strong>{item.type}</strong>
                          <span>{item.claimReference}</span>
                          <small>Source {item.sourceId} · {item.evidenceId}</small>
                        </button>
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
        <div className="evaluation-heading">
          <p className="section-label">Independent evaluation</p>
          <h2 id="evaluation-title">{evaluation?.decision.foundationStatus ?? "Evaluating application"}</h2>
          <p>Runtime projection of the same nine mandatory assertions per case enforced by the Python release oracle.</p>
          {evaluation ? <code>{evaluation.runId}</code> : null}
        </div>
        <dl className="evaluation-measures">
          <div><dt>Scenarios</dt><dd>{evaluation ? `${evaluation.aggregateMeasures.passedCaseCount}/${evaluation.aggregateMeasures.caseCount}` : "—"}</dd></div>
          <div><dt>Assertions</dt><dd>{evaluation ? `${evaluation.aggregateMeasures.passedMandatoryAssertionCount}/${evaluation.aggregateMeasures.mandatoryAssertionCount}` : "—"}</dd></div>
          <div><dt>Pilot eligible</dt><dd>{evaluation?.decision.pilotGateEligible ? "Yes" : "No"}</dd></div>
        </dl>
        {evaluation ? (
          <dl className="evaluation-pins">
            <div><dt>Skill</dt><dd>v{evaluation.pins.logicalSkillVersion}</dd></div>
            <div><dt>Implementation</dt><dd>{evaluation.pins.implementationVersion}</dd></div>
            <div><dt>Package</dt><dd>v{evaluation.pins.packageVersion}</dd></div>
            <div><dt>Binding</dt><dd>{evaluation.pins.consumerBindingCode}</dd></div>
            <div><dt>Deployment</dt><dd>{evaluation.pins.deploymentCode}</dd></div>
            <div><dt>Threshold</dt><dd>{evaluation.pins.thresholdVersion}</dd></div>
          </dl>
        ) : null}
        {evaluation ? (
          <div className="evaluation-cases">
            {evaluation.caseResults.map((caseResult, index) => (
              <details key={caseResult.caseId} open={index === 0}>
                <summary>
                  <span>{caseResult.passed ? "Pass" : "Fail"}</span>
                  <strong>{caseResult.caseId}</strong>
                  <small>{caseResult.requestType} · {caseResult.category} · {caseResult.assertions.filter((item) => item.passed).length}/{caseResult.assertions.length}</small>
                </summary>
                <ul>
                  {caseResult.assertions.map((item) => (
                    <li key={item.name} className={item.passed ? "passed" : "failed"}>
                      <strong>{item.name}</strong>
                      <span>{item.passed ? "Passed" : "Failed"}</span>
                      <small>{item.detail}</small>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        ) : null}
        {evaluation?.decision.pilotBlockers?.length ? <p className="evaluation-note">{evaluation.decision.pilotBlockers.join(" · ")}</p> : null}
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