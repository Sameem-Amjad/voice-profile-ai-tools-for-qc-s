from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from auth.dependencies import current_user
from config import settings
from db.models import User

router = APIRouter()


class MeOut(BaseModel):
    id: str
    email: Optional[str]
    plan: str
    is_admin: bool


@router.get("/me", response_model=MeOut)
async def get_me(user: User = Depends(current_user)):
    clerk_ids = [c.strip() for c in (settings.ADMIN_CLERK_IDS or "").split(",") if c.strip()]
    admin_emails = [e.strip().lower() for e in (settings.ADMIN_EMAILS or "").split(",") if e.strip()]
    is_admin = (
        user.is_admin
        or (clerk_ids and user.clerk_user_id in clerk_ids)
        or bool(admin_emails and user.email and user.email.lower() in admin_emails)
    )
    return MeOut(id=user.id, email=user.email, plan=user.plan, is_admin=is_admin)
