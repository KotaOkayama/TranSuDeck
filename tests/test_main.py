"""
TranSuDeck のテスト
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_read_root():
    """ルートエンドポイントのテスト"""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_config_status():
    """設定状態エンドポイントのテスト"""
    response = client.get("/api/config/status")
    assert response.status_code == 200
    data = response.json()
    assert "configured" in data


def test_health_check():
    """ヘルスチェックエンドポイントのテスト（存在する場合）"""
    response = client.get("/health")
    # エンドポイントが存在しない場合は404でもOK
    assert response.status_code in [200, 404]


def test_static_files():
    """静的ファイルの提供テスト"""
    response = client.get("/static/css/style.css")
    assert response.status_code == 200
    
    response = client.get("/static/js/app.js")
    assert response.status_code == 200
