import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_list_campaigns():
    response = client.get("/campaigns")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(c["name"] == "Campanha do Criador 1" for c in data)
    assert any(c["name"] == "Campanha do Criador 2" for c in data)

def test_list_supporters_success():
    response = client.get("/campaigns/1/supporters")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(s["name"] == "Apoiador 1" for s in data)

def test_list_supporters_not_found():
    response = client.get("/campaigns/999/supporters")
    assert response.status_code == 404 