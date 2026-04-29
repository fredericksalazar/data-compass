import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from ..models import AssessmentSchema, AssessmentSubmission, AssessmentResult, DomainScore
from ..core.firebase import db

logger = logging.getLogger(__name__)
router = APIRouter()

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "cmmi_assessment_v1.json"


@router.get("/assessments/cmmi/schema", response_model=AssessmentSchema)
async def get_cmmi_schema():
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Schema file not found")
    
    with open(DATA_PATH, "r") as f:
        data = json.load(f)
    
    return AssessmentSchema(**data)


@router.post("/assessments/cmmi/calculate", response_model=AssessmentResult)
async def calculate_cmmi_assessment(submission: AssessmentSubmission):
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Schema file not found")
    
    with open(DATA_PATH, "r") as f:
        data = json.load(f)
    
    question_map = {}
    domain_weights = {}
    
    for domain in data.get("domains", []):
        d_name = domain.get("name")
        total_w = 0.0
        for q in domain.get("questions", []):
            q_id = q.get("id")
            q_weight = q.get("weight", 0.0)
            question_map[q_id] = {
                "weight": q_weight,
                "domain": d_name
            }
            total_w += q_weight
        domain_weights[d_name] = total_w
    
    domain_weighted_sums = {d_name: 0.0 for d_name in domain_weights}
    
    for answer in submission.answers:
        if answer.question_id not in question_map:
            raise HTTPException(status_code=400, detail=f"Question ID {answer.question_id} not found in schema")
        
        q_info = question_map[answer.question_id]
        weight = q_info["weight"]
        domain = q_info["domain"]
        
        domain_weighted_sums[domain] += answer.level * weight
    
    results_domain_scores = []
    total_domain_scores_sum = 0.0
    
    for d_name, total_w in domain_weights.items():
        weighted_sum = domain_weighted_sums.get(d_name, 0.0)
        score = weighted_sum / total_w if total_w > 0 else 0.0
        score = round(score, 2)
        
        results_domain_scores.append(DomainScore(domain_name=d_name, score=score))
        total_domain_scores_sum += score
    
    overall_score = round(total_domain_scores_sum / 5, 2)
    
    assessment_id = f"local-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    if db is None:
        logger.error("Firebase is not initialized. Data will NOT be saved to Firestore.")
        logger.error("Check your Firebase credentials configuration in the logs above.")
        raise HTTPException(
            status_code=500,
            detail="Firebase is not available. Please contact support."
        )

    try:
        doc_ref = db.collection("assessments").document()
        doc_data = {
            "lead": submission.lead.model_dump(),
            "answers": [a.model_dump() for a in submission.answers],
            "scores": {
                "overall_score": overall_score,
                "domain_scores": [ds.model_dump() for ds in results_domain_scores]
            },
            "created_at": datetime.now(timezone.utc)
        }
        doc_ref.set(doc_data)
        assessment_id = doc_ref.id
        logger.info(f"✅ Assessment saved to Firestore with ID: {assessment_id}")
    except Exception as e:
        logger.error(f"Failed to save assessment to Firestore: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save assessment: {str(e)}"
        )
    
    return AssessmentResult(
        assessment_id=assessment_id,
        overall_score=overall_score,
        domain_scores=results_domain_scores
    )