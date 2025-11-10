from fastapi.testclient import TestClient
from src.app import app
import uuid

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # basic expectations
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = f"test-{uuid.uuid4().hex}@example.com"

    # signup
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200

    data = client.get("/activities").json()
    assert email in data[activity]["participants"]

    # unregister
    r2 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r2.status_code == 200

    data2 = client.get("/activities").json()
    assert email not in data2[activity]["participants"]


def test_signup_duplicate():
    activity = "Chess Club"
    email = f"dup-{uuid.uuid4().hex}@example.com"

    r1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r1.status_code == 200

    r2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r2.status_code == 400

    # cleanup
    client.delete(f"/activities/{activity}/participants?email={email}")


def test_unregister_not_found():
    activity = "Chess Club"
    email = f"missing-{uuid.uuid4().hex}@example.com"

    r = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r.status_code == 404
