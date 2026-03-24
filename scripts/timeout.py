"""Timeout decorator using signal.SIGALRM — Unix-only, no threads needed.

Usage:
    from timeout import timeout, TimeoutError

    @timeout(5)
    def may_hang():
        ...

    try:
        result = may_hang()
    except TimeoutError:
        result = None  # fallback on timeout
"""

import signal

class TimeoutError(Exception):
    """Raised when a @timeout-decorated function exceeds its time limit."""
    pass


def timeout(seconds: int):
    """Decorator: run function with a timeout in seconds.

    Uses SIGALRM — only works in the main thread on Unix.
    If timeout fires, raises TimeoutError.
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            def _handler(signum, frame):
                raise TimeoutError(f"{func.__name__} timed out after {seconds}s")

            old_handler = signal.signal(signal.SIGALRM, _handler)
            signal.alarm(seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)
                signal.signal(signal.SIGALRM, old_handler)
            return result
        return wrapper
    return decorator
