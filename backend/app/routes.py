from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import ScanResult
from .scanner import analyze_url

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/scan")
async def scan_url(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    url = data.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    report = await analyze_url(url)
    score = report.get("score", 0)

    scan = ScanResult(
        url=url,
        status="completed",
        score=score,
        report_json=report
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return {"id": scan.id, "score": scan.score}

@router.get("/report/{scan_id}")
def get_report(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(ScanResult).filter(ScanResult.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Report not found")
    return scan.report_json
