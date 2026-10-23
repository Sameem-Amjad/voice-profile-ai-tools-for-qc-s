"""
Portfolio demo mode (services/demo.py): caps, payments off, shared accounts, seeding.
Every check must be a no-op when DEMO_MODE is off, which is how production runs.
"""

from __future__ import annotations

import asyncio
import json

import pytest
from fastapi import HTTPException
from sqlalchemy import func, select

from config import settings
from db import models
from services import demo

SHARED = "user_demo_shared"
DATA = {
    "users": [
        {"id": "11111111-1111-4111-a111-111111111111", "clerk_user_id": SHARED, "email": "demo@demo.example", "plan": "pro", "shared_login": True, "joined_days_ago": 30, "usage": [{"days_ago": 3, "seconds": 600}]},
        {"id": "22222222-2222-4222-a222-222222222222", "clerk_user_id": "demo_seed_other", "email": "other@example.com", "plan": "starter", "joined_days_ago": 10, "usage": []},
    ],
    "analyses": [
        {"user_id": "11111111-1111-4111-a111-111111111111", "job_id": "demo-one", "accuracy_percentage": 92.5, "total_words": 40, "correct_words": 37, "script_snippet": "Sample", "audio_duration": 21.0, "days_ago": 2, "result": {"job_id": "demo-one", "aligned_words": [], "stats": {}}},
    ],
    "messages": [{"user_id": "22222222-2222-4222-a222-222222222222", "name": "Other", "email": "other@example.com", "subject": "Hi", "message": "Hello", "status": "pending", "days_ago": 1}],
    "feedback": [{"user_id": "22222222-2222-4222-a222-222222222222", "rating": 5, "text": "Great", "display_name": "O.", "is_approved": True, "days_ago": 1}],
}


@pytest.fixture
def demo_on(monkeypatch, tmp_path):
    path = tmp_path / "demo_data.json"
    path.write_text(json.dumps(DATA))
    monkeypatch.setattr(demo, "DATA_FILE", path)
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    monkeypatch.setattr(settings, "DEMO_MAX_AUDIO_SECONDS", 120)
    demo._daily.clear()
    yield
    demo._daily.clear()


def _user(clerk_id: str) -> models.User:
    return models.User(clerk_user_id=clerk_id, plan="pro")


def test_everything_is_a_no_op_when_demo_mode_is_off(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    demo.check_upload_duration(10_000)
    for _ in range(5):
        demo.consume_daily("transcription", 1)
    demo.refuse_payments()
    demo.refuse_plan_change(_user(SHARED))


def test_uploads_longer_than_the_demo_cap_are_refused(demo_on):
    demo.check_upload_duration(119)
    with pytest.raises(HTTPException) as e:
        demo.check_upload_duration(121)
    assert e.value.status_code == 413
    assert "2 minutes" in e.value.detail["message"]


def test_daily_allowance_is_shared_and_runs_out(demo_on):
    demo.consume_daily("transcription", 2)
    demo.consume_daily("transcription", 2)
    with pytest.raises(HTTPException) as e:
        demo.consume_daily("transcription", 2)
    assert e.value.status_code == 429
    demo.consume_daily("chat", 2)  # a separate allowance


def test_payments_are_off_and_shared_accounts_keep_their_plan(demo_on):
    with pytest.raises(HTTPException) as e:
        demo.refuse_payments()
    assert e.value.status_code == 403
    with pytest.raises(HTTPException):
        demo.refuse_plan_change(_user(SHARED))
    demo.refuse_plan_change(_user("demo_seed_other"))  # other seeded users can be changed


def test_samples_offer_the_script_but_not_the_planted_slips(demo_on, tmp_path):
    data = {**DATA, "samples": [{"slug": "take-one", "title": "Take one", "kind": "Audiobook", "duration": 21, "script": "Hello there.", "slips": ["hello → hi"], "file": "samples/take-one.mp3"}]}
    (tmp_path / "demo_data.json").write_text(json.dumps(data))
    assert demo.samples() == [{"slug": "take-one", "title": "Take one", "kind": "Audiobook", "duration": 21, "script": "Hello there."}]
    assert demo.sample_file("take-one") is None  # listed, but the file is missing
    (tmp_path / "samples").mkdir()
    (tmp_path / "samples" / "take-one.mp3").write_bytes(b"ID3")
    assert demo.sample_file("take-one") == tmp_path / "samples" / "take-one.mp3"
    assert demo.sample_file("../demo_data") is None


def test_one_click_sign_in_only_issues_tickets_for_the_shared_accounts(demo_on, monkeypatch):
    sent = []

    class FakeClerk:
        def __init__(self, **_): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *_): pass
        async def post(self, url, headers, json):
            sent.append((url, json))
            return type("R", (), {"status_code": 200, "json": lambda self: {"token": "ticket-1"}, "text": ""})()

    monkeypatch.setattr(demo.httpx, "AsyncClient", FakeClerk)
    monkeypatch.setattr(settings, "CLERK_SECRET_KEY", "sk_test_x")
    loop = asyncio.get_event_loop()
    assert loop.run_until_complete(demo.sign_in_ticket("narrator")) == "ticket-1"
    assert sent == [("https://api.clerk.com/v1/sign_in_tokens", {"user_id": SHARED, "expires_in_seconds": 120})]
    with pytest.raises(HTTPException) as e:  # the test data has no shared admin
        loop.run_until_complete(demo.sign_in_ticket("admin"))
    assert e.value.status_code == 404
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    with pytest.raises(HTTPException):
        loop.run_until_complete(demo.sign_in_ticket("narrator"))
    assert len(sent) == 1


def test_seed_builds_the_demo_data_and_can_run_twice(demo_on):
    from db.session import AsyncSessionLocal

    async def counts():
        async with AsyncSessionLocal() as db:
            out = {}
            for name, model in (("users", models.User), ("analyses", models.AnalysisResult), ("subscriptions", models.Subscription), ("messages", models.ContactMessage), ("feedback", models.Feedback)):
                out[name] = (await db.execute(select(func.count()).select_from(model).where(model.user_id.in_([u["id"] for u in DATA["users"]]) if name != "users" else model.id.in_([u["id"] for u in DATA["users"]])))).scalar_one()
            return out

    loop = asyncio.get_event_loop()
    loop.run_until_complete(demo.seed())
    loop.run_until_complete(demo.seed())
    assert loop.run_until_complete(counts()) == {"users": 2, "analyses": 1, "subscriptions": 2, "messages": 1, "feedback": 1}
