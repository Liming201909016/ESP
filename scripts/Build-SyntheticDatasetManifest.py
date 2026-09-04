from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[1]
DATASET_ROOT = ROOT / "test-data" / "security-review"
SCHEMA_PATH = DATASET_ROOT / "dataset.schema.json"
DATASET_PATH = DATASET_ROOT / "v1.0.0" / "dataset.json"
MANIFEST_PATH = DATASET_PATH.parent / "manifest.json"


def canonical_json_hash(value: object) -> str:
    content = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("ascii")
    return hashlib.sha256(content).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Validate the existing manifest without rewriting it")
    arguments = parser.parse_args()
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    dataset = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    errors = sorted(Draft202012Validator(schema).iter_errors(dataset), key=lambda error: list(error.path))
    if errors:
        messages = [f"{'/'.join(map(str, error.path))}: {error.message}" for error in errors]
        raise ValueError("\n".join(messages))
    case_ids = [case["caseId"] for case in dataset["cases"]]
    if len(case_ids) != len(set(case_ids)):
        raise ValueError("Dataset case IDs must be unique")
    request_types = Counter(case["requestType"] for case in dataset["cases"])
    categories = Counter(case["category"] for case in dataset["cases"])
    digest = canonical_json_hash(dataset)
    manifest = {
        "datasetCode": dataset["datasetCode"],
        "version": dataset["version"],
        "classification": dataset["classification"],
        "synthetic": dataset["synthetic"],
        "artifact": "dataset.json",
        "sha256": digest,
        "caseCount": len(dataset["cases"]),
        "requestTypes": dict(sorted(request_types.items())),
        "categories": dict(sorted(categories.items())),
        "labelStatus": "PendingDomainSMEReview",
    }
    if arguments.check:
        existing_manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        if existing_manifest != manifest:
            raise ValueError("Synthetic dataset manifest is stale; rebuild it without --check")
        action = "check"
    else:
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="ascii")
        action = "build"
    print(f"Synthetic dataset {action}: PASS ({manifest['caseCount']} cases, SHA256 {digest})")


if __name__ == "__main__":
    main()