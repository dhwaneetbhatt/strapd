import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


class UpdateHomebrewFormulaTest(unittest.TestCase):
    def test_version_is_numeric_and_download_urls_keep_tag(self):
        script = Path(__file__).with_name("update_homebrew_formula.py")
        platforms = ["macos-aarch64", "macos-x86_64", "linux-aarch64", "linux-x86_64"]
        for tag in ["v1.5.0", "1.5.0"]:
            with self.subTest(tag=tag), tempfile.TemporaryDirectory() as directory:
                formula = Path(directory) / "homebrew-tap/Formula/strapd.rb"
                formula.parent.mkdir(parents=True)
                formula.write_text('version "v1.3.0"\n' + "".join(
                    f'url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.3.0/strapd-{platform}.tar.gz"\nsha256 "{"a" * 64}"\n'
                    for platform in platforms
                ))
                environment = {**os.environ, "TAG_NAME": tag}
                for os_name in ["MACOS", "LINUX"]:
                    for architecture in ["AARCH64", "X86_64"]:
                        environment[f"{os_name}_SHA_{architecture}"] = "b" * 64
                subprocess.run([sys.executable, str(script.resolve())], cwd=directory,
                               env=environment, check=True, capture_output=True)
                result = formula.read_text()
                self.assertIn('version "1.5.0"', result)
                self.assertNotIn('version "v1.5.0"', result)
                for platform in platforms:
                    self.assertIn(f"/download/{tag}/strapd-{platform}.tar.gz", result)
                self.assertEqual(result.count('sha256 "' + "b" * 64 + '"'), 4)


if __name__ == "__main__":
    unittest.main()
