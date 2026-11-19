from datetime import date
from typing import Literal
from pydantic import BaseModel, HttpUrl

class LocalizedText(BaseModel):
    en: str
    te: str
    hi: str

class Scheme(BaseModel):
    scheme_id: str
    name: LocalizedText
    level: Literal["central", "state"]
    state: str | None = None
    category: str
    summary: LocalizedText
    benefits: list[str]
    eligibility_rules: dict
    required_documents: list[str]
    how_to_apply: list[str]
    official_urls: list[HttpUrl]
    helpline: str
    last_verified: date | None = None
    verification_status: Literal["verified", "needs_review"] = "needs_review"
