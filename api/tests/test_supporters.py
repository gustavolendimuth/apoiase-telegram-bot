from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

# Dados de seed: Apoiador 1 (id=101, ativo, campanha 1), Apoiador 2 (id=102, inativo, campanha 1)

def test_link_supporter_success():
    response = client.post("/supporters/link", json={
        "campaign_id": 1,
        "supporter_id": 101,
        "telegram_id": 123456789
    })
    assert response.status_code == 200
    assert "vinculado" in response.json()["message"]

def test_link_supporter_not_found():
    response = client.post("/supporters/link", json={
        "campaign_id": 1,
        "supporter_id": 999,
        "telegram_id": 123456789
    })
    assert response.status_code == 404

def test_link_supporter_inactive():
    response = client.post("/supporters/link", json={
        "campaign_id": 1,
        "supporter_id": 102,
        "telegram_id": 123456789
    })
    assert response.status_code == 400

def test_check_supporter_active():
    # Primeiro, vincula
    client.post("/supporters/link", json={
        "campaign_id": 1,
        "supporter_id": 101,
        "telegram_id": 123456789
    })
    response = client.post("/supporters/check", json={
        "campaign_id": 1,
        "telegram_id": 123456789
    })
    assert response.status_code == 200
    assert response.json()["is_active"] is True

def test_check_supporter_not_linked():
    response = client.post("/supporters/check", json={
        "campaign_id": 1,
        "telegram_id": 987654321
    })
    assert response.status_code == 200
    assert response.json()["is_active"] is False

def test_check_supporter_inactive():
    # Vincula apoiador inativo
    client.post("/supporters/link", json={
        "campaign_id": 1,
        "supporter_id": 102,
        "telegram_id": 222222222
    })
    response = client.post("/supporters/check", json={
        "campaign_id": 1,
        "telegram_id": 222222222
    })
    assert response.status_code == 200
    assert response.json()["is_active"] is False 