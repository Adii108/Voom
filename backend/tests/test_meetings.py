import sys
from pathlib import Path

# Add backend root directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.database import Base, engine, seed_default_user
from app.main import app


client = TestClient(app)


def run_tests():
    print("--- Starting Meeting API Tests ---")

    # Reset DB tables & seed
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_default_user()
    print("[OK] Database reset & seeded")

    # Test 1: Create Instant Meeting
    res = client.post("/api/meetings/instant")
    assert res.status_code == 201, f"Instant meeting failed: {res.text}"
    instant_data = res.json()
    assert instant_data["meeting_code"].startswith("vom-")
    assert instant_data["meeting_type"] == "instant"
    assert instant_data["status"] == "waiting"
    assert instant_data["meeting_link"].endswith(instant_data["meeting_code"])
    print(f"[OK] Instant meeting created: {instant_data['meeting_code']}")

    # Test 2: Schedule Meeting
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    payload = {
        "title": "Design Sync",
        "description": "Discuss UI tokens and layout",
        "scheduled_at": tomorrow.isoformat(),
        "duration": 45,
    }
    res = client.post("/api/meetings/schedule", json=payload)
    assert res.status_code == 201, f"Schedule meeting failed: {res.text}"
    scheduled_data = res.json()
    assert scheduled_data["title"] == "Design Sync"
    assert scheduled_data["meeting_type"] == "scheduled"

    assert scheduled_data["duration"] == 45
    print(f"[OK] Scheduled meeting created: {scheduled_data['meeting_code']}")

    # Test 3: Get Meeting by Code
    code = scheduled_data["meeting_code"]
    res = client.get(f"/api/meetings/{code}")
    assert res.status_code == 200, f"Get meeting failed: {res.text}"
    get_data = res.json()
    assert get_data["meeting_code"] == code
    assert get_data["title"] == "Design Sync"
    print("[OK] Get meeting by code verified")

    # Test 4: Join Meeting
    join_payload = {"display_name": "Aditya"}
    res = client.post(f"/api/meetings/{code}/join", json=join_payload)
    assert res.status_code == 201, f"Join meeting failed: {res.text}"
    join_data = res.json()
    assert join_data["participant"]["display_name"] == "Aditya"
    assert join_data["meeting"]["meeting_code"] == code
    print("[OK] Join meeting verified")

    # Test 5: List Upcoming Meetings
    res = client.get("/api/meetings/upcoming")
    assert res.status_code == 200
    upcoming = res.json()
    assert len(upcoming) >= 2
    print(f"[OK] Listed {len(upcoming)} upcoming meetings")

    # Test 6: Direct navigation / on-demand meeting retrieval
    res = client.get("/api/meetings/vom-000-000")
    assert res.status_code == 200
    assert res.json()["meeting_code"] == "vom-000-000"
    print("[OK] On-demand meeting creation passed")

    # Test 7: Schedule with Invalid Payload (422)
    res = client.post("/api/meetings/schedule", json={"title": ""})
    assert res.status_code == 422
    print("[OK] 422 validation test passed")

    print("\nALL TESTS PASSED SUCCESSFULLY!")



if __name__ == "__main__":
    run_tests()
