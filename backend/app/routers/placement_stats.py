from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.placement_stat import PlacementStat
from app.schemas.schemas import PlacementStatOut, PlacementStatUpdate
from app.utils.auth import require_role

router = APIRouter(
    prefix="/api/placement-stats",
    tags=["Placement Stats"]
)

@router.get("/", response_model=PlacementStatOut)
def get_placement_stats(db: Session = Depends(get_db)):
    """Get the current placement stats. Creates defaults if it doesn't exist."""
    stats = db.query(PlacementStat).filter(PlacementStat.id == 1).first()
    if not stats:
        stats = PlacementStat(id=1, highest_package="0 LPA", average_package="0 LPA", placement_percentage="0%", total_hiring_partners=0)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

@router.put("/", response_model=PlacementStatOut)
def update_placement_stats(
    stats_update: PlacementStatUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Update placement stats (Admin only)"""
    from fastapi.responses import JSONResponse
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
        
    stats = db.query(PlacementStat).filter(PlacementStat.id == 1).first()
    
    if not stats:
        stats = PlacementStat(id=1)
        db.add(stats)
        
    stats.highest_package = stats_update.highest_package
    stats.average_package = stats_update.average_package
    stats.placement_percentage = stats_update.placement_percentage
    stats.total_hiring_partners = stats_update.total_hiring_partners
    
    db.commit()
    db.refresh(stats)
    return stats
