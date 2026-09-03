from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
BRIEF = DOCS / "00-Hackathon" / "project-brief.md"
PROFILE = DOCS / "00-Hackathon" / "mvp-delivery-profile.md"
DEMO_SCRIPT = DOCS / "00-Hackathon" / "demo-script.md"
REGISTRATION = DOCS / "00-Hackathon" / "registration-content.md"
BACKLOG = DOCS / "08-Development" / "hackathon-mvp-backlog.md"


def section_value(text: str, heading: str) -> str:
    match = re.search(rf"^## {re.escape(heading)}\s*$\s*([^\n]+)", text, re.MULTILINE)
    if not match:
        raise ValueError(f"Missing or empty section: {heading}")
    return match.group(1).strip()


def validate_manifest(errors: list[str]) -> None:
    actual = sorted(
        path.relative_to(DOCS).as_posix()
        for path in DOCS.rglob("*")
        if path.is_file() and path.name != "MANIFEST.txt" and "__pycache__" not in path.parts and path.suffix != ".pyc"
    )
    listed = sorted(line.strip() for line in (DOCS / "MANIFEST.txt").read_text(encoding="utf-8").splitlines() if line.strip())
    if actual != listed:
        errors.append(f"MANIFEST mismatch: missing={sorted(set(actual) - set(listed))}, stale={sorted(set(listed) - set(actual))}")


def validate_links(errors: list[str]) -> None:
    markdown_link = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")
    for document in [ROOT / "README.md", *DOCS.rglob("*.md")]:
        text = document.read_text(encoding="utf-8")
        for target in markdown_link.findall(text):
            target = target.split("#", 1)[0]
            if not target or "://" in target or target.startswith("mailto:"):
                continue
            resolved = (document.parent / target).resolve()
            if not resolved.exists():
                errors.append(f"Broken local link in {document.relative_to(ROOT)}: {target}")


def main() -> None:
    errors: list[str] = []
    required_files = [BRIEF, PROFILE, DEMO_SCRIPT, REGISTRATION, BACKLOG]
    for path in required_files:
        if not path.exists():
            errors.append(f"Missing Hackathon document: {path.relative_to(ROOT)}")
    if errors:
        raise ValueError("\n".join(errors))

    brief = BRIEF.read_text(encoding="utf-8")
    profile = PROFILE.read_text(encoding="utf-8")
    demo_script = DEMO_SCRIPT.read_text(encoding="utf-8")
    registration = REGISTRATION.read_text(encoding="utf-8")
    backlog = BACKLOG.read_text(encoding="utf-8")
    root_readme = (ROOT / "README.md").read_text(encoding="utf-8")

    title = section_value(brief, "Title")
    tagline = section_value(brief, "Tagline")
    if len(title) > 140:
        errors.append(f"Hackathon title exceeds 140 characters: {len(title)}")
    if len(tagline) > 300:
        errors.append(f"Hackathon tagline exceeds 300 characters: {len(tagline)}")

    registration_title = section_value(registration, "Title")
    registration_tagline = section_value(registration, "Tagline")
    registration_description = re.search(
        r"^## Description\s*$\s*(.*?)(?=^## Keywords\s*$)",
        registration,
        re.MULTILINE | re.DOTALL,
    )
    if not registration_description:
        errors.append("Registration content has no Description body")
        description_length = 0
    else:
        description_length = len(registration_description.group(1).strip())
    if len(registration_title) > 140:
        errors.append(f"Registration title exceeds 140 characters: {len(registration_title)}")
    if len(registration_tagline) > 300:
        errors.append(f"Registration tagline exceeds 300 characters: {len(registration_tagline)}")
    if description_length > 30000:
        errors.append(f"Registration description exceeds 30000 characters: {description_length}")
    for term in ["Enterprise Skill Platform", "One Copilot", "N governed Skills", "N reusable Plugins", "Responsible AI"]:
        if term not in registration:
            errors.append(f"Registration content is missing ESP emphasis: {term}")
    if "do not claim customer validation" not in registration.lower():
        errors.append("Registration accuracy notes do not guard against unsupported readiness claims")
    repository_url = "https://github.com/Liming201909016/ESP"
    if repository_url not in registration or repository_url not in brief:
        errors.append("Hackathon registration and project brief must contain the canonical code location")
    if "public repository contains the validated architecture" not in registration.lower():
        errors.append("Registration notes must accurately describe the published foundation")
    if "runnable local vertical slice is under active Hackathon development" not in registration:
        errors.append("Registration notes must disclose that the runnable vertical slice is still in development")

    skill_codes = set(re.findall(r"LS-SEC-[A-Z-]+", profile))
    plugin_codes = set(re.findall(r"PLG-[A-Z-]+", profile))
    if len(skill_codes) != 5:
        errors.append(f"MVP profile must define 5 unique Skills, found {len(skill_codes)}")
    if len(plugin_codes) != 4:
        errors.append(f"MVP profile must define 4 unique Plugins, found {len(plugin_codes)}")

    required_profile_terms = [
        "Demo Mode, required",
        "Connected Mode, optional for Hackathon",
        "one-command local startup",
        "many-to-many",
        "Pilot quality",
    ]
    for term in required_profile_terms:
        if term not in profile:
            errors.append(f"MVP profile is missing required boundary: {term}")

    required_demo_terms = ["5 minutes", "SYN-RG-001", "NeedsInformation", "secondary Consumer", "recorded fallback"]
    for term in required_demo_terms:
        if term not in demo_script:
            errors.append(f"Demo script is missing: {term}")

    if "HCK-101" not in backlog or "HCK-401" not in backlog:
        errors.append("Hackathon backlog does not cover runnable core and Connected Mode")
    if "local Demo Mode" not in root_readme or "optional Connected Mode" not in root_readme:
        errors.append("Root README does not lead with the required local/optional connected boundary")

    validate_manifest(errors)
    validate_links(errors)
    if errors:
        raise ValueError("\n".join(errors))
    print(
        "Hackathon documentation: PASS "
        f"(title={len(title)} chars, tagline={len(tagline)} chars, "
        f"registrationDescription={description_length} chars, "
        f"skills={len(skill_codes)}, plugins={len(plugin_codes)})"
    )


if __name__ == "__main__":
    main()