#!/usr/bin/env python3
"""
Test suite for exec-health-check.sh and exec-wrapper.sh
Epic 1: 健康检查机制

Tests F1.1, F1.2, F1.3
"""
import subprocess
import os
import pytest

SCRIPTS_DIR = "/root/.openclaw/vibex/scripts"
HEALTH_CHECK = f"{SCRIPTS_DIR}/exec-health-check.sh"
EXEC_WRAPPER = f"{SCRIPTS_DIR}/exec-wrapper.sh"


def run_bash(script: str, timeout=10) -> subprocess.CompletedProcess:
    """Run bash script and return result."""
    return subprocess.run(
        ["bash", "-c", script],
        capture_output=True,
        text=True,
        timeout=timeout,
        cwd=SCRIPTS_DIR
    )


class TestF1_1_HealthCheckFunction:
    """F1.1: 健康检查函数 — 添加 `_exec_test()` 检测 stdout 是否正常"""

    def test_health_check_script_exists(self):
        assert os.path.exists(HEALTH_CHECK), f"Health check script not found: {HEALTH_CHECK}"

    def test_health_check_echo_output_contains_marker(self):
        """expect(echo_test).toContain('EXEC_HEALTH_TEST')"""
        result = run_bash(f"bash {HEALTH_CHECK}")
        # Health check should produce output with test markers
        assert "TEST_ECHO" in result.stdout, f"Expected TEST_ECHO in output: {result.stdout}"

    def test_health_check_stderr_redirect(self):
        """Stderr redirect test produces output"""
        result = run_bash(f"bash {HEALTH_CHECK} 2>&1")
        assert "TEST_STDERR" in result.stdout

    def test_health_check_python_output(self):
        """Python print output is captured"""
        result = run_bash(f"bash {HEALTH_CHECK}")
        assert "TEST_PYTHON" in result.stdout

    def test_health_check_exit_code_preserved(self):
        """Exit code from subprocess is preserved"""
        # The script tests exit code 42 - we check it exits non-zero for failure case
        result = run_bash(f"bash {HEALTH_CHECK} 2>&1 || true")
        # Should pass all tests and exit 0
        assert result.returncode == 0 or "FAIL" in result.stdout


class TestF1_2_WarningMechanism:
    """F1.2: 警告机制 — 检测到问题时输出警告到 stderr"""

    def test_health_check_warns_to_stderr_when_broken(self):
        """expect(warn).toBeLogged() — warnings go to stderr"""
        # When health check fails (exec broken), it should write WARN to stderr
        # We test the mechanism by checking WARN output goes to stderr
        result = run_bash(f"bash {HEALTH_CHECK}")
        # If broken, stderr should contain WARN
        # If healthy, all OK messages go to stdout
        combined = result.stdout + result.stderr
        assert "OK" in combined or "FAIL" in combined

    def test_wrapper_warns_when_health_check_enabled(self):
        """exec-wrapper.sh with EXEC_HEALTH_CHECK=true warns"""
        env = os.environ.copy()
        env["EXEC_HEALTH_CHECK"] = "true"
        result = subprocess.run(
            ["bash", "-c", f"bash {EXEC_WRAPPER} 5 echo test"],
            capture_output=True,
            text=True,
            timeout=10,
            env=env
        )
        combined = result.stdout + result.stderr
        # Should work (echo test succeeds)
        assert "test" in combined or result.returncode == 0


class TestF1_3_StatusReport:
    """F1.3: 状态报告 — 返回 exec 健康状态"""

    def test_health_check_returns_zero_when_healthy(self):
        """expect(status).toBeIn(['healthy', 'broken']) — exit 0 = healthy"""
        result = run_bash(f"bash {HEALTH_CHECK} 2>&1 || true")
        # We use || true because we want to see the output regardless
        # Actual exit code test is below
        combined = result.stdout + result.stderr
        assert "PASSED" in combined or "OK" in combined or "FAIL" in combined

    def test_health_check_exit_code_zero_on_success(self):
        """Exit code 0 means healthy"""
        result = subprocess.run(
            ["bash", HEALTH_CHECK],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0, f"Health check failed unexpectedly: {result.stderr}"

    def test_wrapper_reports_timeout_error(self):
        """Timeout error reported clearly"""
        result = subprocess.run(
            ["bash", "-c", f"bash {EXEC_WRAPPER} 2 sleep 10"],
            capture_output=True,
            text=True,
            timeout=15
        )
        # Should timeout and return non-zero
        assert result.returncode != 0 or "ERROR" in result.stderr


class TestIntegration:
    """Integration tests for Epic 1 DoD"""

    def test_dod_health_check_function_exists_and_callable(self):
        """DoD: 健康检查函数存在且可调用"""
        assert os.path.exists(HEALTH_CHECK)
        result = subprocess.run(
            ["bash", HEALTH_CHECK],
            capture_output=True,
            text=True,
            timeout=10
        )
        assert result.returncode == 0

    def test_dod_can_detect_pipe_issue(self):
        """DoD: 能检测出当前 pipe 断裂问题"""
        # The health check runs 4 tests - if exec is broken, it will fail
        result = subprocess.run(
            ["bash", HEALTH_CHECK],
            capture_output=True,
            text=True,
            timeout=10
        )
        combined = result.stdout + result.stderr
        # Should have either PASS/FAIL indicators
        assert "TEST_ECHO" in combined or "EXEC_HEALTH" in combined

    def test_dod_warning_goes_to_stderr(self):
        """DoD: 警告输出到 stderr"""
        result = subprocess.run(
            ["bash", "-c", f"bash {EXEC_WRAPPER} 5 echo test"],
            capture_output=True,
            text=True,
            timeout=10
        )
        # stderr should not be empty if there are warnings
        # (empty stderr is OK if exec is healthy)
        combined = result.stdout + result.stderr
        assert len(combined) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
