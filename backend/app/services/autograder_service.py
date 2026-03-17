import json
import os
import subprocess
import tempfile
from typing import Any


DEFAULT_AUTOGRADER_IMAGE = os.getenv("AUTOGRADER_IMAGE", "python:3.11-alpine")
DEFAULT_AUTOGRADER_TIMEOUT = int(os.getenv("AUTOGRADER_TIMEOUT_SECONDS", "5"))


def run_autograder(code: str, language: str, tests_json: str) -> dict[str, Any]:
    if language != "python":
        return {
            "status": "failed",
            "score": 0.0,
            "max_score": 0.0,
            "feedback": "Only python autograding is supported in v1.",
        }

    try:
        tests_payload = json.loads(tests_json or "{}")
    except json.JSONDecodeError:
        return {
            "status": "failed",
            "score": 0.0,
            "max_score": 0.0,
            "feedback": "Autograder test configuration is invalid JSON.",
        }

    test_cases = tests_payload.get("test_cases") or []
    if not test_cases:
        return {
            "status": "failed",
            "score": 0.0,
            "max_score": 0.0,
            "feedback": "No autograder test cases configured for this assignment.",
        }

    docker_available = _docker_available()
    if not docker_available:
        return {
            "status": "pending_manual_review",
            "score": 0.0,
            "max_score": float(len(test_cases)),
            "feedback": "Docker is not available to run the isolated autograder. Review manually or configure Docker access for the backend.",
        }

    passed = 0
    feedback_lines = []

    with tempfile.TemporaryDirectory() as tmpdir:
        code_path = os.path.join(tmpdir, "solution.py")
        with open(code_path, "w", encoding="utf-8") as handle:
            handle.write(code)

        for index, case in enumerate(test_cases, start=1):
            expected_output = str(case.get("expected_output", "")).strip()
            stdin = str(case.get("input", ""))
            result = _run_python_in_container(tmpdir, stdin)

            if result["timeout"]:
                feedback_lines.append(f"Test {index}: timed out.")
                continue
            if result["returncode"] != 0:
                stderr = result["stderr"].strip() or "Runtime error"
                feedback_lines.append(f"Test {index}: runtime error: {stderr}")
                continue

            actual_output = result["stdout"].strip()
            if actual_output == expected_output:
                passed += 1
                feedback_lines.append(f"Test {index}: passed.")
            else:
                feedback_lines.append(
                    f"Test {index}: expected `{expected_output}` but got `{actual_output}`."
                )

    max_score = float(len(test_cases))
    score = float(passed)
    status = "passed" if passed == len(test_cases) else "failed"
    return {
        "status": status,
        "score": score,
        "max_score": max_score,
        "feedback": "\n".join(feedback_lines),
    }


def _docker_available() -> bool:
    try:
        completed = subprocess.run(
            ["docker", "version"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        return completed.returncode == 0
    except Exception:
        return False


def _run_python_in_container(tmpdir: str, stdin: str) -> dict[str, Any]:
    command = [
        "docker",
        "run",
        "--rm",
        "--network",
        "none",
        "--memory",
        "128m",
        "--cpus",
        "0.5",
        "-v",
        f"{tmpdir}:/workspace:ro",
        "-w",
        "/workspace",
        DEFAULT_AUTOGRADER_IMAGE,
        "python",
        "solution.py",
    ]
    try:
        completed = subprocess.run(
            command,
            input=stdin,
            capture_output=True,
            text=True,
            timeout=DEFAULT_AUTOGRADER_TIMEOUT,
            check=False,
        )
        return {
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "returncode": completed.returncode,
            "timeout": False,
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "stdout": exc.stdout or "",
            "stderr": exc.stderr or "",
            "returncode": -1,
            "timeout": True,
        }
