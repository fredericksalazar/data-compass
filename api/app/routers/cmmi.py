import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from ..models import AssessmentSchema, AssessmentSubmission, AssessmentResult, DomainScore

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
    
    # Map questions for quick access and group by domain
    question_map = {}
    domain_weights = {}  # {domain_name: total_weight}
    
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
    
    # Initialize scores
    domain_weighted_sums = {d_name: 0.0 for d_name in domain_weights}
    
    # Process submission
    for answer in submission.answers:
        if answer.question_id not in question_map:
            raise HTTPException(status_code=400, detail=f"Question ID {answer.question_id} not found in schema")
        
        q_info = question_map[answer.question_id]
        weight = q_info["weight"]
        domain = q_info["domain"]
        
        domain_weighted_sums[domain] += answer.level * weight
    
    # Calculate scores per domain
    results_domain_scores = []
    total_domain_scores_sum = 0.0
    
    for d_name, total_w in domain_weights.items():
        weighted_sum = domain_weighted_sums.get(d_name, 0.0)
        # Average weighted: sum(level * weight) / sum(weights of domain)
        score = weighted_sum / total_w if total_w > 0 else 0.0
        score = round(score, 2)
        
        results_domain_scores.append(DomainScore(domain_name=d_name, score=score))
        total_domain_scores_sum += score
        
    # Overall score: sum of 5 domains / 5
    overall_score = round(total_domain_scores_sum / 5, 2)
    
    return AssessmentResult(
        overall_score=overall_score,
        domain_scores=results_domain_scores
    )