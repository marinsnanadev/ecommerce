import importlib

import pytest

from app import auth


def test_production_requires_secret_key(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("SECRET_KEY", raising=False)
    try:
        with pytest.raises(RuntimeError):
            importlib.reload(auth)
    finally:
        monkeypatch.undo()
        importlib.reload(auth)


def test_dev_allows_default_secret_key(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("SECRET_KEY", raising=False)
    importlib.reload(auth)
    assert auth.SECRET_KEY == auth.DEV_SECRET_KEY