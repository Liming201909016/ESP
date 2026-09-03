export type RegistryStatus = "healthy" | "unavailable";

export interface SkillRegistration {
  code: string;
  name: string;
  version: string;
  implementationVersion: string;
  plugins: string[];
  oversight: "ReviewRequired" | "ApprovalRequired";
}

export interface PluginRegistration {
  code: string;
  name: string;
  version: string;
  mode: "Demo";
  status: RegistryStatus;
}

export const plugins: PluginRegistration[] = [
  { code: "PLG-DOC-SOURCE", name: "Document Source", version: "1.0.0", mode: "Demo", status: "healthy" },
  { code: "PLG-RUNBOOK", name: "Runbook", version: "1.0.0", mode: "Demo", status: "healthy" },
  { code: "PLG-EVIDENCE", name: "Evidence", version: "1.0.0", mode: "Demo", status: "healthy" },
  { code: "PLG-REPORT", name: "Report", version: "1.0.0", mode: "Demo", status: "healthy" },
];

export const skills: SkillRegistration[] = [
  { code: "LS-SEC-DOC-INTAKE", name: "Document Intake", version: "1.0.0", implementationVersion: "demo-1.0.0", plugins: ["PLG-DOC-SOURCE", "PLG-EVIDENCE"], oversight: "ReviewRequired" },
  { code: "LS-SEC-EVIDENCE-EXTRACT", name: "Evidence Extraction", version: "1.0.0", implementationVersion: "demo-1.0.0", plugins: ["PLG-DOC-SOURCE", "PLG-EVIDENCE"], oversight: "ReviewRequired" },
  { code: "LS-SEC-REVIEW", name: "Security Review", version: "1.0.0", implementationVersion: "demo-1.0.0", plugins: ["PLG-RUNBOOK", "PLG-EVIDENCE"], oversight: "ReviewRequired" },
  { code: "LS-SEC-RISK-RATING", name: "Risk Rating", version: "1.0.0", implementationVersion: "demo-1.0.0", plugins: ["PLG-RUNBOOK", "PLG-EVIDENCE"], oversight: "ApprovalRequired" },
  { code: "LS-SEC-REPORT-GEN", name: "Report Generation", version: "1.0.0", implementationVersion: "demo-1.0.0", plugins: ["PLG-REPORT", "PLG-EVIDENCE"], oversight: "ReviewRequired" },
];

export function validateRegistry() {
  const errors: string[] = [];
  const pluginCodes = new Set(plugins.map((plugin) => plugin.code));
  const skillCodes = new Set(skills.map((skill) => skill.code));

  if (pluginCodes.size !== 4 || plugins.length !== 4) errors.push("Registry must contain four unique Plugins");
  if (skillCodes.size !== 5 || skills.length !== 5) errors.push("Registry must contain five unique Skills");

  for (const skill of skills) {
    if (!/^\d+\.\d+\.\d+$/.test(skill.version)) errors.push(`${skill.code} has an invalid version`);
    for (const pluginCode of skill.plugins) {
      if (!pluginCodes.has(pluginCode)) errors.push(`${skill.code} references unavailable Plugin ${pluginCode}`);
    }
  }
  for (const plugin of plugins) {
    if (!/^\d+\.\d+\.\d+$/.test(plugin.version)) errors.push(`${plugin.code} has an invalid version`);
  }

  if (errors.length) throw new Error(errors.join("; "));
}

export function getRegistry() {
  validateRegistry();
  return {
    mode: "Demo" as const,
    status: plugins.every((plugin) => plugin.status === "healthy") ? "healthy" as const : "degraded" as const,
    skills,
    plugins,
  };
}