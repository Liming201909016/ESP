from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker


ROOT = Path(__file__).resolve().parent
SCHEMA_PATH = ROOT / "schemas" / "logical-skill-contract.schema.json"
EXAMPLES_PATH = ROOT / "examples" / "logical-skill-contract-examples.json"


def main() -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    examples = json.loads(EXAMPLES_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    failures: list[str] = []
    for index, example in enumerate(examples["valid"], start=1):
        errors = list(validator.iter_errors(example))
        if errors:
            failures.append(f"valid[{index}] failed: {errors[0].message}")
    for index, example in enumerate(examples["invalid"], start=1):
        if not list(validator.iter_errors(example)):
            failures.append(f"invalid[{index}] unexpectedly passed")
    if failures:
        raise ValueError("\n".join(failures))
    print(f"Contract examples: PASS ({len(examples['valid'])} valid, {len(examples['invalid'])} invalid)")


if __name__ == "__main__":
    main()