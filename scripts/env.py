#!/usr/bin/env python3
"""
GARUDA A.S.T.R.A — Universal Configuration & Profile Manager
Usage:
    python scripts/env.py status          # Inspect active configuration and verify DB latency
    python scripts/env.py switch local    # Switch to offline localhost mode (DB: localhost:5432)
    python scripts/env.py switch hybrid   # Switch to hybrid mode (Local servers + Central Cloud DB)
    python scripts/env.py switch deployed # Switch to deployed mode (Cloud servers + Central Cloud DB)
"""

import sys
import os
import re
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT_DIR / ".env"
EXAMPLE_FILE = ROOT_DIR / ".env.example"

def mask_db_url(url: str) -> str:
    """Mask password in PostgreSQL connection string for safe printing."""
    if not url:
        return "(empty)"
    return re.sub(r":([^:@]+)@", r":****@", url)

def read_env_dict() -> dict:
    if not ENV_FILE.exists():
        if EXAMPLE_FILE.exists():
            print("⚠️  No root .env found. Initializing from .env.example...")
            ENV_FILE.write_text(EXAMPLE_FILE.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            print("❌ Neither .env nor .env.example found at project root!")
            sys.exit(1)

    result = {}
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                result[key.strip()] = val.strip().strip('"').strip("'")
    return result

def update_env_file(updates: dict):
    if not ENV_FILE.exists():
        read_env_dict()

    content = ENV_FILE.read_text(encoding="utf-8")
    for key, new_val in updates.items():
        pattern = rf"^{re.escape(key)}=.*$"
        replacement = f'{key}={new_val}'
        if re.search(pattern, content, flags=re.MULTILINE):
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        else:
            content += f"\n{key}={new_val}"

    ENV_FILE.write_text(content, encoding="utf-8")

def check_db_connectivity(db_url: str):
    """Attempt a live PostgreSQL query and measure round-trip latency."""
    if not db_url:
        print("❌ Cannot test DB: DATABASE_URL is empty.")
        return

    try:
        import asyncio
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text
        
        async_url = db_url
        if async_url.startswith("postgresql://"):
            async_url = async_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        async def _ping():
            start = time.perf_counter()
            engine = create_async_engine(async_url)
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT 1"))
                val = result.scalar()
            elapsed_ms = (time.perf_counter() - start) * 1000
            await engine.dispose()
            return val, elapsed_ms

        val, elapsed_ms = asyncio.run(_ping())
        print(f"   ✅ Database Status: Connected (Ping: {elapsed_ms:.1f}ms, Query: {val})")
    except Exception as e:
        print(f"   ❌ Database Connection Failed: {e}")

def show_status():
    env = read_env_dict()
    profile = env.get("APP_PROFILE", "unknown").upper()
    db_url = env.get("DATABASE_URL", "")
    api_url = env.get("NEXT_PUBLIC_API_URL", "")
    ws_url = env.get("NEXT_PUBLIC_WS_URL", "")

    print("\n" + "=" * 60)
    print(" 🦅 GARUDA A.S.T.R.A — CENTRAL CONFIGURATION STATUS")
    print("=" * 60)
    print(f" • Active Profile   : {profile}")
    print(f" • Environment Mode : {env.get('APP_ENV', 'development')}")
    print(f" • Database Target  : {mask_db_url(db_url)}")
    print(f" • Frontend API URL : {api_url}")
    print(f" • Frontend WS URL  : {ws_url}")
    print(f" • Mobile App API   : {env.get('EXPO_PUBLIC_API_URL', 'not set')}")
    print("-" * 60)
    print(" 🔍 Testing Live Database Connectivity...")
    check_db_connectivity(db_url)
    print("=" * 60 + "\n")

def switch_profile(target: str):
    target = target.lower().strip()
    env = read_env_dict()

    local_db = env.get("LOCAL_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/astra_db")
    cloud_db = env.get("CLOUD_DATABASE_URL", env.get("DATABASE_URL", ""))

    if target == "local":
        updates = {
            "APP_PROFILE": "local",
            "DATABASE_URL": local_db,
            "NEXT_PUBLIC_API_URL": "http://localhost:8000/api/v1",
            "NEXT_PUBLIC_WS_URL": "ws://localhost:8000/api/v1/ws/connect"
        }
        update_env_file(updates)
        print(f"\n✅ Switched to [LOCAL] profile (Offline mode, DB: localhost:5432).")
    elif target == "hybrid":
        if not cloud_db:
            print("❌ Cannot switch to hybrid: CLOUD_DATABASE_URL is not configured in .env!")
            return
        updates = {
            "APP_PROFILE": "hybrid",
            "DATABASE_URL": cloud_db,
            "NEXT_PUBLIC_API_URL": "http://localhost:8000/api/v1",
            "NEXT_PUBLIC_WS_URL": "ws://localhost:8000/api/v1/ws/connect"
        }
        update_env_file(updates)
        print(f"\n✅ Switched to [HYBRID] profile (Localhost servers + Shared Cloud Database).")
    elif target == "deployed":
        if not cloud_db:
            print("❌ Cannot switch to deployed: CLOUD_DATABASE_URL is not configured in .env!")
            return
        updates = {
            "APP_PROFILE": "deployed",
            "DATABASE_URL": cloud_db,
            "NEXT_PUBLIC_API_URL": "https://backend.garudaastra.dpdns.org/api/v1",
            "NEXT_PUBLIC_WS_URL": "wss://backend.garudaastra.dpdns.org/api/v1/ws/connect"
        }
        update_env_file(updates)
        print(f"\n✅ Switched to [DEPLOYED] profile (Cloud servers + Shared Cloud Database).")
    else:
        print(f"❌ Unknown profile '{target}'. Choose from: 'local', 'hybrid', 'deployed'.")
        sys.exit(1)

    show_status()

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] in ("status", "check"):
        show_status()
    elif args[0] == "switch" and len(args) > 1:
        switch_profile(args[1])
    else:
        print(__doc__)
