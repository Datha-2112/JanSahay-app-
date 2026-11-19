from typing import Literal
from pydantic import BaseModel

class Rule(BaseModel):
    field: str
    op: Literal["eq", "ne", "in", "not_in", "lt", "lte", "gt", "gte", "exists"]
    value: object | None = None

class EligibilityRules(BaseModel):
    all: list[Rule] = []
    any: list[Rule] = []
    exclusions: list[Rule] = []

class EligibilityResult(BaseModel):
    scheme_id: str
    status: Literal["eligible", "maybe", "not_eligible"]
    reasons_met: list[str]
    reasons_failed: list[str]
    missing_fields: list[str]
