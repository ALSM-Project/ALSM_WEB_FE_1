"""Exercise Linux atomic directory/link exchange without root or production paths."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("bootstrap", Path(__file__).with_name("bootstrap.py"))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


class BootstrapTests(unittest.TestCase):
    def test_exchange_and_restore_preserve_original_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            live = root / "user"
            live.mkdir()
            (live / "index.html").write_text("existing production bytes", encoding="utf-8")
            initial = root / "initial"
            initial.mkdir()
            (initial / "index.html").write_text("existing production bytes", encoding="utf-8")
            pending = root / ".prepare-user"
            pending.symlink_to(initial)
            original_inode = live.stat().st_ino
            b.exchange(live, pending)
            self.assertTrue(live.is_symlink())
            self.assertEqual(pending.stat().st_ino, original_inode)
            self.assertEqual((live / "index.html").read_text(), "existing production bytes")
            b.exchange(live, pending)
            self.assertFalse(live.is_symlink())
            self.assertEqual(live.stat().st_ino, original_inode)
            self.assertTrue(pending.is_symlink())


if __name__ == "__main__":
    unittest.main(verbosity=2)
