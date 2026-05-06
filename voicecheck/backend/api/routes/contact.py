from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from auth.dependencies import current_user
from db.models import User, ContactMessage
from db.session import get_db

router = APIRouter()

class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class ContactOut(BaseModel):
    id: str
    status: str

@router.post("/contact", response_model=ContactOut)
async def submit_contact(
    body: ContactRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = ContactMessage(
        user_id=user.id if user.clerk_user_id != "anonymous-dev-user" else None,
        name=body.name,
        email=body.email,
        subject=body.subject,
        message=body.message,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return ContactOut(id=msg.id, status=msg.status)
