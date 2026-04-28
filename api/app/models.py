from pydantic import BaseModel, Field
from typing import List


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


class AssessmentSubmission(BaseModel):
    answers: List[Answer]


class DomainScore(BaseModel):
    domain_name: str
    score: float


class AssessmentResult(BaseModel):
    overall_score: float
    domain_scores: List[DomainScore]