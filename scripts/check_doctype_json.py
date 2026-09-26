#!/usr/bin/env python3
"""Reject DocType JSON that would break a fresh `bench install-app dms`.

`bench install-app` builds one MySQL table per DocType straight from the JSON on
disk, and frappe writes the `create table` statement itself. For a child table the
schema builder appends the parent columns on its own:

	frappe/database/mariadb/schema.py :: MariaDBTable.create()
		if self.meta.get("istable", default=0):
			additional_definitions += [
				f"parent varchar({varchar_len})",
				f"parentfield varchar({varchar_len})",
				f"parenttype varchar({varchar_len})",
				"index parent(parent)",
			]

`parent`, `parenttype` and `parentfield` are not in `frappe.db.DEFAULT_COLUMNS`,
so `get_column_definitions()` does not skip them: a child table that also declares
them emits the same column twice and MariaDB aborts the whole app install with
`(1060, "Duplicate column name 'parent'")`. That is what took the Server CI job
down on `Service Type Item`.

An existing site survives this, because its table predates the bad JSON and
`alter()` only ever adds missing columns. The breakage therefore only shows up on
fresh installs and in CI, which is exactly why it is worth catching at commit
time. The checks here are the cheap static subset of what a fresh install throws
on.

Usage:
	python3 scripts/check_doctype_json.py          # whole app
	python3 scripts/check_doctype_json.py dms      # one tree
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Columns frappe creates by itself for every child table; declaring them in the
# JSON duplicates the column and the table can never be created.
CHILD_TABLE_COLUMNS = ("parent", "parenttype", "parentfield")

# frappe/database/schema.py refuses a fieldname once it reaches this length.
FIELDNAME_LIMIT = 64

APP_ROOT = Path(__file__).resolve().parent.parent


def display_path(path: Path) -> str:
	try:
		return str(path.relative_to(APP_ROOT))
	except ValueError:
		return str(path)


def check_doctype(path: Path) -> list[str]:
	"""Return one message per problem that would stop a fresh install."""
	where = display_path(path)
	try:
		doc = json.loads(path.read_text(encoding="utf-8"))
	except (OSError, ValueError) as exc:
		return [f"{where}: unreadable as JSON ({exc})"]

	if not isinstance(doc, dict) or doc.get("doctype") != "DocType":
		return []

	name = doc.get("name") or path.parent.name
	fields = doc.get("fields") or []
	problems: list[str] = []

	if doc.get("istable"):
		for field in fields:
			fieldname = field.get("fieldname")
			if fieldname in CHILD_TABLE_COLUMNS:
				problems.append(
					f"{where}: child table {name!r} declares the {fieldname!r} field, but "
					"frappe adds that column for child tables itself - a fresh install "
					f"aborts with duplicate column {fieldname!r}"
				)

	seen: set[str] = set()
	for field in fields:
		fieldname = field.get("fieldname")
		if not fieldname:
			problems.append(f"{where}: {name!r} has a field with no fieldname")
			continue

		if fieldname in seen:
			problems.append(
				f"{where}: {name!r} declares the {fieldname!r} field twice; the second "
				"one is a duplicate column"
			)
		elif not field.get("fieldtype"):
			problems.append(f"{where}: {name!r}.{fieldname} has no fieldtype, so no column is defined")
		elif len(fieldname) >= FIELDNAME_LIMIT:
			problems.append(
				f"{where}: {name!r}.{fieldname} is {len(fieldname)} characters long; frappe "
				f"allows at most {FIELDNAME_LIMIT - 1}"
			)
		seen.add(fieldname)

	return problems


def main(argv: list[str]) -> int:
	roots = [Path(arg) for arg in argv[1:]] or [APP_ROOT / "dms"]

	checked = 0
	problems: list[str] = []
	for root in roots:
		paths = [root] if root.is_file() else sorted(root.glob("**/doctype/*/*.json"))
		for path in paths:
			checked += 1
			problems += check_doctype(path)

	if problems:
		print(f"{len(problems)} problem(s) in {checked} DocType JSON file(s); a fresh")
		print("`bench install-app dms` would fail:\n")
		for problem in problems:
			print(f"  {problem}")
		return 1

	print(f"OK: {checked} DocType JSON file(s) safe for a fresh install")
	return 0


if __name__ == "__main__":
	sys.exit(main(sys.argv))
