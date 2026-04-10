#!/usr/bin/env python3
"""
dedup_api.py — REST API for proposal deduplication

Endpoints:
  GET  /health              — health check
  GET  /projects            — list existing projects
  POST /dedup               — check for duplicate proposals
  GET  /dedup?name=&goal=   — check via query params

Usage:
  python3 dedup_api.py [--port PORT] [--host HOST]
  curl -X POST http://localhost:8765/dedup \
    -H "Content-Type: application/json" \
    -d '{"name": "my-project", "goal": "build something"}'
"""

import argparse
import json
import os
import sys
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from typing import Optional

# Add scripts dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from dedup.dedup import (
    check_duplicate_projects,
    load_existing_projects,
    detect_duplicates,
    similarity_score,
    extract_keywords,
    alert_level,
    format_alert_message,
)

PORT = int(os.environ.get("DEDUP_API_PORT", "8765"))
HOST = os.environ.get("DEDUP_API_HOST", "0.0.0.0")
WORKSPACE = os.environ.get("TEAM_TASKS_DIR", "/root/.openclaw/workspace-coord/team-tasks")


# ==================== CORS helper ====================

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


# ==================== Request handlers ====================

def handle_health() -> dict:
    return {"status": "ok", "service": "dedup-api", "version": "1.0.0"}


def handle_list_projects(workspace: Optional[str] = None) -> dict:
    projects = load_existing_projects(workspace or WORKSPACE)
    return {
        "count": len(projects),
        "projects": projects,
    }


def handle_dedup(
    name: str,
    goal: str,
    workspace: Optional[str] = None,
    threshold: Optional[float] = None,
) -> dict:
    if not name:
        return {"error": "name is required", "code": "VALIDATION_ERROR"}
    if not goal:
        return {"error": "goal is required", "code": "VALIDATION_ERROR"}

    ws = workspace or WORKSPACE
    t = threshold if threshold is not None else 0.4

    result = check_duplicate_projects(name, goal, ws, t)
    return result


# ==================== HTTP Handler ====================

class DedupAPIHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _send_json(self, status: int, data: dict):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        body = self.rfile.read(length)
        return json.loads(body.decode("utf-8"))

    def do_OPTIONS(self):
        self._send_json(204, {})

    def do_GET(self):
        try:
            if self.path == "/health" or self.path == "/":
                self._send_json(200, handle_health())
                return

            if self.path == "/projects":
                # Optional: ?workspace=/path/to/workspace
                import urllib.parse
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path)._replace(query="").query)
                # Actually use parsed path
                parsed = urllib.parse.urlparse(self.path)
                params = urllib.parse.parse_qs(parsed.query)
                workspace = params.get("workspace", [None])[0]
                self._send_json(200, handle_list_projects(workspace))
                return

            if self.path.startswith("/dedup?"):
                # GET /dedup?name=xxx&goal=yyy&threshold=0.4&workspace=xxx
                import urllib.parse
                parsed = urllib.parse.urlparse(self.path)
                params = urllib.parse.parse_qs(parsed.query)
                # Support both old (name/goal) and new (project_name/description) field names
                name = params.get("project_name", params.get("name", [""]))[0]
                goal = params.get("description", params.get("goal", [""]))[0]
                workspace = params.get("workspace", [None])[0]
                threshold_str = params.get("threshold", [None])[0]
                threshold = float(threshold_str) if threshold_str else None
                result = handle_dedup(name, goal, workspace, threshold)
                self._send_json(200 if "error" not in result else 400, result)
                return

            # Not found
            self._send_json(404, {"error": "Not found", "code": "NOT_FOUND"})
        except Exception as e:
            self._send_json(500, {"error": str(e), "code": "INTERNAL_ERROR"})

    def do_POST(self):
        try:
            if self.path == "/dedup":
                body = self._read_body()
                # Support both old (name/goal) and new (project_name/description) field names
                name = body.get("project_name", body.get("name", ""))
                goal = body.get("description", body.get("goal", ""))
                workspace = body.get("workspace")
                threshold = body.get("threshold")

                result = handle_dedup(
                    name,
                    goal,
                    workspace,
                    float(threshold) if threshold is not None else None,
                )
                status = 200 if "error" not in result else 400
                self._send_json(status, result)
                return

            # Not found
            self._send_json(404, {"error": "Not found", "code": "NOT_FOUND"})
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON", "code": "INVALID_JSON"})
        except Exception as e:
            self._send_json(500, {"error": str(e), "code": "INTERNAL_ERROR"})

    def log_message(self, format, *args):
        # Suppress default logging; use structured logging
        pass


def run_server(host: str, port: int):
    server = HTTPServer((host, port), DedupAPIHandler)
    print(f"[dedup-api] Starting on {host}:{port}")
    print(f"[dedup-api] Endpoints:")
    print(f"  GET  http://{host}:{port}/health")
    print(f"  GET  http://{host}:{port}/projects")
    print(f"  POST http://{host}:{port}/dedup")
    print(f"  GET  http://{host}:{port}/dedup?name=...&goal=...")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[dedup-api] Shutting down")
        server.shutdown()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dedup REST API")
    parser.add_argument("--host", default=HOST, help="Host to bind")
    parser.add_argument("--port", type=int, default=PORT, help="Port to bind")
    args = parser.parse_args()
    run_server(args.host, args.port)
