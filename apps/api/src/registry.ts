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

export interface ConsumerBinding {
  code: string;
  consumerCode: string;
  status: "Active" | "Suspended";
  skillCodes: string[];
}

export const consumers = [
  { code: "CON-SEC-REVIEW-AGENT", name: "Security Review Copilot", type: "Copilot" },
  { code: "CON-ARCH-REVIEW", name: "Architecture Review Workflow", type: "Workflow" },
] as const;

export const bindings: ConsumerBinding[] = [
  { code: "CB-ESP-DEMO-001", consumerCode: "CON-SEC-REVIEW-AGENT", status: "Active", skillCodes: ["LS-SEC-DOC-INTAKE", "LS-SEC-EVIDENCE-EXTRACT", "LS-SEC-REVIEW", "LS-SEC-RISK-RATING", "LS-SEC-REPORT-GEN"] },
  { code: "CB-ARCH-DEMO-001", consumerCode: "CON-ARCH-REVIEW", status: "Active", skillCodes: ["LS-SEC-DOC-INTAKE", "LS-SEC-EVIDENCE-EXTRACT"] },
];

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

  const consumerCodes = new Set<string>(consumers.map((consumer) => consumer.code));
  const bindingCodes = new Set(bindings.map((binding) => binding.code));
  if (bindingCodes.size !== bindings.length) errors.push("Consumer Binding codes must be unique");
  for (const binding of bindings) {
    if (!consumerCodes.has(binding.consumerCode)) errors.push(`${binding.code} references an unavailable Consumer`);
    for (const skillCode of binding.skillCodes) {
      if (!skillCodes.has(skillCode)) errors.push(`${binding.code} references unavailable Skill ${skillCode}`);
    }
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
    consumers,
    bindings,
  };
}

export function resolveBinding(bindingCode: string, requiredSkillCodes: string[]) {
  const binding = bindings.find((candidate) => candidate.code === bindingCode);
  if (!binding || binding.status !== "Active") throw new Error(`Active Consumer Binding not found: ${bindingCode}`);
  const missingSkills = requiredSkillCodes.filter((skillCode) => !binding.skillCodes.includes(skillCode));
  if (missingSkills.length) throw new Error(`${bindingCode} does not permit Skills: ${missingSkills.join(", ")}`);
  const consumer = consumers.find((candidate) => candidate.code === binding.consumerCode);
  if (!consumer) throw new Error(`Consumer not found: ${binding.consumerCode}`);
  return { binding, consumer };
}