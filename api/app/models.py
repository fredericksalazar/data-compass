from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional


class Option(BaseModel):
    level: int
    text: str


class Question(BaseModel):
    id: str
    title: str
    question_text: str
    weight: float
    options: List[Option]


class Domain(BaseModel):
    name: str
    questions: List[Question]


class AssessmentSchema(BaseModel):
    version: str
    total_questions: int
    domains: List[Domain]


class Answer(BaseModel):
    question_id: str
    level: int = Field(..., ge=1, le=5)


class Lead(BaseModel):
    name: str = Field(..., max_length=120)
    company: str = Field("", max_length=120)
    role: str = Field("", max_length=120)
    email: Optional[EmailStr] = Field(None)

    @field_validator('email', mode='before')
    @classmethod
    def empty_str_to_none(cls, v: object) -> object:
        if v == '':
            return None
        return v


class AssessmentSubmission(BaseModel):
    lead: Lead
    answers: List[Answer]


class DomainScore(BaseModel):
    domain_name: str
    score: float


class AssessmentResult(BaseModel):
    assessment_id: str
    overall_score: float
    domain_scores: List[DomainScore]