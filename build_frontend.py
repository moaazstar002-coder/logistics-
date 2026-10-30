import os
import subprocess
from pathlib import Path


FRONTEND_DIRECTORY = Path(__file__).parent / "FrontEnd"
NPM_EXECUTABLE = "npm.cmd" if os.name == "nt" else "npm"


def main() -> None:
    subprocess.run([NPM_EXECUTABLE, "ci"], cwd=FRONTEND_DIRECTORY, check=True)
    subprocess.run(
        [NPM_EXECUTABLE, "run", "build"],
        cwd=FRONTEND_DIRECTORY,
        check=True,
    )


if __name__ == "__main__":
    main()
