#!/usr/bin/env python3
"""Administrator-only preparation; run only after EC2, Nginx and URLs are audited."""
import argparse
import ctypes
import grp
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import pwd
import shutil
import subprocess
import sys

spec = importlib.util.spec_from_file_location("alsm_deploy", Path(__file__).with_name("deploy.py"))
d = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d)


def exchange(left, right):
    """Linux renameat2 exchanges a directory and a symlink with no missing-root window."""
    libc = ctypes.CDLL(None, use_errno=True)
    result = libc.renameat2(-100, os.fsencode(left), -100, os.fsencode(right), 2)
    if result:
        raise OSError(ctypes.get_errno(), "Atomic directory/symlink exchange failed")


def root_directory(path, mode=0o755):
    d.require(not path.is_symlink(), "Unexpected symlink: " + str(path))
    path.mkdir(parents=True, exist_ok=True)
    os.chown(path, 0, 0)
    path.chmod(mode)


def account():
    try:
        user = pwd.getpwnam("alsmrunner")
    except KeyError:
        subprocess.run(["useradd", "--system", "--user-group", "--create-home", "--home-dir",
                        "/var/lib/alsmrunner", "--shell", "/usr/sbin/nologin", "alsmrunner"], check=True)
        user = pwd.getpwnam("alsmrunner")
    groups = {grp.getgrgid(gid).gr_name for gid in os.getgrouplist(user.pw_name, user.pw_gid)}
    d.require(user.pw_uid != 0 and not groups.intersection({"sudo", "admin", "docker", "lxd", "disk"}),
              "Existing runner account has privileged group membership; inspect manually")
    d.require(groups == {"alsmrunner"} and user.pw_dir == "/var/lib/alsmrunner",
              "Existing account groups/home differ from dedicated runner policy; inspect manually")
    # Membership is not enough: explicit sudoers rules must also be absent.
    result = subprocess.run(["sudo", "-n", "-l", "-U", "alsmrunner"], stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, text=True, env={**os.environ, "LC_ALL": "C"})
    d.require("not allowed to run sudo" in result.stdout + result.stderr,
              "Unable to verify that alsmrunner has no sudo permissions")
    return user


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for portal in d.PORTALS:
        parser.add_argument("--" + portal + "-url", required=True)
    args = parser.parse_args()
    d.require(os.geteuid() == 0, "Run as the Ubuntu administrator with sudo")
    urls = {p: d.origin(getattr(args, p + "_url")) for p in d.PORTALS}
    root = Path("/var/www/alsm")
    d.require(root.is_dir() and not root.is_symlink(), "Unexpected website root")
    subprocess.run(["nginx", "-t"], check=True)
    for service in ("nginx", "docker"):
        subprocess.run(["systemctl", "is-active", "--quiet", service], check=True)
    for binary in ("curl", "rsync", "python3"):
        d.require(shutil.which(binary), "Missing prerequisite: " + binary)

    # Preflight all three sites before creating an account or changing a live directory.
    for portal, url in urls.items():
        site = root / portal
        d.require((site / "index.html").is_file(), "No existing build for " + portal)
        d.require(d.digest(d.fetch(url + "/")) == d.digest((site / "index.html").read_bytes()),
                  "HTTPS does not serve the expected local build: " + portal)
        d.require(json.loads(d.fetch(url + "/api/v1/health")).get("status") == "ok",
                  "Backend HTTPS health failed: " + portal)

    user = account()
    config_dir = Path("/etc/alsm-deploy")
    root_directory(config_dir)
    config = config_dir / "portals.json"
    wanted = {"urls": urls}
    if config.exists():
        d.require(d.load_config(config) == wanted, "Existing origin config differs; review a URL migration first")
    else:
        d.atomic_json(config, wanted)
        config.chmod(0o644)
    install_dir = Path("/usr/local/lib/alsm-deploy")
    root_directory(install_dir)
    installed = install_dir / "deploy.py"
    temporary = install_dir / ".deploy.py.new"
    d.require(not temporary.exists() and not temporary.is_symlink(), "Unexpected installer temporary file")
    shutil.copyfile(Path(__file__).with_name("deploy.py"), temporary)
    os.chown(temporary, 0, 0)
    temporary.chmod(0o644)
    os.replace(temporary, installed)
    releases = root / "releases"
    backups = root / ".backups"
    root_directory(releases)
    root_directory(backups, 0o700)

    for portal, url in urls.items():
        base = releases / portal
        site = root / portal
        initial = base / "initial"
        backup = backups / (portal + ".before-cicd")
        d.require(not base.is_symlink(), "Unexpected portal release symlink")
        base.mkdir(exist_ok=True)
        if site.is_symlink():
            d.require(os.readlink(site) == str(base / "current"), "Unexpected existing website symlink")
            d.require(backup.is_dir() and not backup.is_symlink(), "Original root backup missing")
            d.Deployer(base, portal, url).target()
            d.check_https(url, (base / "current").resolve(strict=True))
            print("Already prepared:", portal)
            continue
        d.require(not backup.exists() and not backup.is_symlink(), "Refusing to overwrite existing backup")
        if initial.exists():
            d.verify(initial, portal, "initial")
            d.require(d.file_map(initial) == d.file_map(site), "Initial snapshot differs; inspect previous setup")
        else:
            staging = base / ".bootstrap-initial"
            d.require(not staging.exists() and not staging.is_symlink(), "Interrupted bootstrap copy needs inspection")
            # Validate the ORIGINAL before following anything into the snapshot.
            d.file_map(site)
            shutil.copytree(site, staging, symlinks=False)
            d.stamp(staging, portal, "initial", urls)
            d.make_readonly(staging)
            os.rename(staging, initial)
        d.require(not (base / "current").exists() and not (base / "current").is_symlink(),
                  "Unexpected pre-existing current link")
        d.switch(base, initial)
        pending = root / (".prepare-" + portal)
        d.require(not pending.exists() and not pending.is_symlink(), "Interrupted portal exchange needs inspection")
        pending.symlink_to(base / "current")
        exchange(site, pending)
        os.rename(pending, backup)  # The unmodified original directory stays root-only forever.
        try:
            d.check_https(url, initial)
        except BaseException:
            exchange(site, backup)
            backup.unlink()  # This is the new symlink after exchange, never the original directory.
            (base / "current").unlink()
            raise
        os.chown(base, user.pw_uid, user.pw_gid)
        base.chmod(0o755)
        print("Prepared with original backup preserved:", portal)

    # Install recovery independently of the runner so TERM/SIGKILL and power-loss journals recover.
    service_dir = Path("/etc/systemd/system")
    service = """[Unit]
Description=Recover interrupted ALSM frontend deployments
After=network-online.target nginx.service
Wants=network-online.target
[Service]
Type=oneshot
User=alsmrunner
Group=alsmrunner
ExecStart=/usr/bin/python3 /usr/local/lib/alsm-deploy/deploy.py recover
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ReadWritePaths=/var/www/alsm/releases
InaccessiblePaths=-/opt/alsm -/run/docker.sock -/etc/letsencrypt
"""
    timer = """[Unit]
Description=Check for interrupted ALSM frontend deployments
[Timer]
OnBootSec=45s
OnUnitActiveSec=30s
Unit=alsm-deploy-recovery.service
[Install]
WantedBy=timers.target
"""
    (service_dir / "alsm-deploy-recovery.service").write_text(service, encoding="utf-8")
    (service_dir / "alsm-deploy-recovery.timer").write_text(timer, encoding="utf-8")
    subprocess.run(["systemctl", "daemon-reload"], check=True)
    subprocess.run(["systemctl", "enable", "--now", "alsm-deploy-recovery.timer"], check=True)
    print("Deployer SHA256:", hashlib.sha256(installed.read_bytes()).hexdigest())
    print("Nginx configuration, certificates, containers and backend were not modified or restarted.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("Bootstrap stopped:", str(error), file=sys.stderr)
        sys.exit(1)
