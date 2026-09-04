#!/usr/bin/env python3
"""Render a dbt model's Jinja SQL locally (no dbt/warehouse) for both
is_incremental() branches, and flag unbalanced parens / trailing commas.

Usage:
    render_dbt_model.py path/to/model.sql
    render_dbt_model.py path/to/model.sql --quiet
    render_dbt_model.py path/to/model.sql --show true
"""
import argparse
import re
import sys

import jinja2


def render(path: str, is_incremental: bool) -> str:
    src = open(path).read()
    env = jinja2.Environment()
    env.globals["is_incremental"] = lambda: is_incremental
    env.globals["this"] = "THIS_TABLE"
    env.globals["config"] = lambda **kwargs: ""
    env.globals["ref"] = lambda name: f"REF_{name}".upper()
    env.globals["source"] = lambda a, b: f"SOURCE_{a}_{b}".upper()
    env.globals["var"] = lambda k, d=None: d
    return env.from_string(src).render()


def check(out: str) -> list:
    problems = []
    opens, closes = out.count("("), out.count(")")
    if opens != closes:
        problems.append(f"paren mismatch: {opens} open vs {closes} close")
    if re.search(r",\s*\)", out):
        problems.append("possible trailing comma before ')'")
    if re.search(r",\s*(?:from|FROM)\b", out):
        problems.append("possible trailing comma before FROM")
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument(
        "--show",
        choices=["true", "false"],
        help="print only this branch's full rendered SQL",
    )
    ap.add_argument(
        "--quiet",
        action="store_true",
        help="only print check results, not rendered SQL",
    )
    args = ap.parse_args()

    if args.show is not None:
        print(render(args.path, args.show == "true"))
        return

    ok = True
    for inc in (False, True):
        out = render(args.path, inc)
        problems = check(out)
        status = "OK" if not problems else "PROBLEMS: " + "; ".join(problems)
        print(f"{args.path} incremental={inc}: {status}")
        if problems:
            ok = False
        if not args.quiet:
            print(out)
            print("-" * 80)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
