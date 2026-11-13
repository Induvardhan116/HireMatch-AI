import os
import shutil
import tempfile
import pytest

# Create an isolated temporary directory for test database and uploaded files
# BEFORE importing app.main so the development database is never touched.
_TEST_TMP_DIR = tempfile.mkdtemp(prefix="hirematch_pytest_")
_TEST_DB_PATH = os.path.join(_TEST_TMP_DIR, "test_hirematch.db").replace("\\", "/")
_TEST_UPLOAD_DIR = os.path.join(_TEST_TMP_DIR, "uploads")
os.makedirs(_TEST_UPLOAD_DIR, exist_ok=True)

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ["UPLOAD_DIR"] = _TEST_UPLOAD_DIR
os.environ["SECRET_KEY"] = "pytest-isolated-test-secret-key-at-least-32-chars"


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_environment():
    yield
    from app.database import engine
    engine.dispose()
    shutil.rmtree(_TEST_TMP_DIR, ignore_errors=True)

