"""Deterministic scheme eligibility rules. Unknown required values stay unknown."""
from typing import Any


def _compare(actual: Any, op: str, expected: Any) -> bool | None:
    if op == "exists":
        return actual is not None
    if actual is None:
        return None
    try:
        return {
            "eq": lambda: actual == expected,
            "ne": lambda: actual != expected,
            "in": lambda: actual in expected,
            "not_in": lambda: actual not in expected,
            "lt": lambda: actual < expected,
            "lte": lambda: actual <= expected,
            "gt": lambda: actual > expected,
            "gte": lambda: actual >= expected,
        }[op]()
    except (KeyError, TypeError):
        return False


def evaluate_rule(rule: dict, profile: dict) -> tuple[bool | None, str, str]:
    field, op, expected = rule["field"], rule["op"], rule.get("value")
    actual = profile.get(field)
    result = _compare(actual, op, expected)
    return result, field, op


def evaluate_scheme(scheme: dict, profile: dict) -> dict:
    if scheme.get("verification_status") != "verified":
        return {"scheme_id": scheme["scheme_id"], "status": "maybe", "reasons_met": [], "reasons_failed": [], "missing_fields": ["eligibility_details"]}
    rules = scheme.get("eligibility_rules", {})
    met, failed, missing = [], [], []
    all_rules = rules.get("all", [])
    any_rules = rules.get("any", [])
    exclusions = rules.get("exclusions", [])

    if not (all_rules or any_rules or exclusions):
        return {"scheme_id": scheme["scheme_id"], "status": "maybe", "reasons_met": [], "reasons_failed": [], "missing_fields": ["eligibility_details"]}

    def collect(group, label):
        results = []
        for rule in group:
            ok, field, op = evaluate_rule(rule, profile)
            results.append(ok)
            if ok is None:
                if field not in missing: missing.append(field)
            elif ok:
                met.append(f"{field} {op}")
            else:
                failed.append(f"{field} {op}")
        return results

    all_results = collect(all_rules, "all")
    any_results = collect(any_rules, "any")
    exclusion_results = collect(exclusions, "exclusion")
    hard_fail = any(x is False for x in all_results) or (any_results and all(x is False for x in any_results)) or any(x is True for x in exclusion_results)
    if hard_fail:
        status = "not_eligible"
    elif missing or any(x is None for x in any_results):
        status = "maybe"
    else:
        status = "eligible"
    return {"scheme_id": scheme["scheme_id"], "status": status, "reasons_met": met, "reasons_failed": failed, "missing_fields": missing}
