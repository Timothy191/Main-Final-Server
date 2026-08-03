#!/usr/bin/env python3
"""
Hermes Credentials Injector
Parses API keys from .env and writes them directly to ~/.hermes/auth.json
to allow headless/non-interactive execution of Hermes.
"""
import os
import json
import hashlib
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HERMES_DIR = Path("/home/timothy/.hermes")
AUTH_JSON = HERMES_DIR / "auth.json"

def get_fingerprint(key):
    return "sha256:" + hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]

def generate_id():
    return "".join(random.choices("0123456789abcdef", k=6))

def load_env():
    env = {}
    env_file = ROOT / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def main():
    if not AUTH_JSON.exists():
        print(f"[Hermes Injector] auth.json not found at {AUTH_JSON}")
        return

    env = load_env()
    
    # Read auth.json
    try:
        with open(AUTH_JSON) as f:
            auth_data = json.load(f)
    except Exception as e:
        print(f"[Hermes Injector] Failed to parse auth.json: {e}")
        return

    pool = auth_data.setdefault("credential_pool", {})

    # 1. OpenRouter
    or_pool = env.get("OPENROUTER_KEY_POOL", "")
    if or_pool:
        keys = [k.strip() for k in or_pool.split(",") if k.strip()]
        or_list = []
        for idx, key in enumerate(keys):
            or_list.append({
                "id": generate_id(),
                "label": f"OPENROUTER_KEY_POOL_{idx + 1}",
                "auth_type": "api_key",
                "priority": idx,
                "source": f"env:OPENROUTER_KEY_POOL",
                "last_status": None,
                "last_status_at": None,
                "last_error_code": None,
                "last_error_reason": None,
                "last_error_message": None,
                "last_error_reset_at": None,
                "base_url": "https://openrouter.ai/api/v1",
                "request_count": 0,
                "secret_fingerprint": get_fingerprint(key)
            })
        pool["openrouter"] = or_list
        print(f"[Hermes Injector] Injected {len(or_list)} OpenRouter keys.")

    # 2. OpenAI
    openai_key = env.get("OPENAI_API_KEY", "")
    if openai_key:
        pool["openai"] = [{
            "id": generate_id(),
            "label": "OPENAI_API_KEY",
            "auth_type": "api_key",
            "priority": 0,
            "source": "env:OPENAI_API_KEY",
            "last_status": None,
            "last_status_at": None,
            "last_error_code": None,
            "last_error_reason": None,
            "last_error_message": None,
            "last_error_reset_at": None,
            "base_url": "https://api.openai.com/v1",
            "request_count": 0,
            "secret_fingerprint": get_fingerprint(openai_key)
        }]
        print("[Hermes Injector] Injected OpenAI key.")

    # Write auth.json back
    try:
        with open(AUTH_JSON, "w") as f:
            json.dump(auth_data, f, indent=2)
        print("[Hermes Injector] auth.json written successfully.")
    except Exception as e:
        print(f"[Hermes Injector] Failed to write auth.json: {e}")

if __name__ == "__main__":
    main()
