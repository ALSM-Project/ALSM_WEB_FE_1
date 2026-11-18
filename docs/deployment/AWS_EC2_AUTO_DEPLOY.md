# ALSM AWS EC2 automatic frontend deployment

This guide applies to `ALSM_WEB_FE_1`, `ALSM_WEB_FE_2`, and `ALSM_WEB_FE_3`.

## Overview

Each repository has `.github/workflows/deploy-ec2.yml`, triggered on `push` to `develop` or manual workflow dispatch:

1. GitHub-hosted runner: Node 22, `npm ci`, lint, tests where existing CI requires tests, Vite production build, upload artifact.
2. A **dedicated self-hosted runner on the EC2 instance** downloads the artifact, publishes it as an immutable release and switches an atomic `current` symlink.
3. A public HTTPS GET smoke test runs; failures restore the previous symlink.

The server's existing Nginx `root /var/www/alsm/user|staff|web3` stays unchanged, as these paths are changed once to symlinks during bootstrap.

**Do not enable deployment until the initial EC2 setup below is done.** Do not make port 22 public for GitHub-hosted runners.

## GitHub Actions repository variables

Set these **in all three repositories** under Settings → Secrets and variables → Actions → Variables:

| Variable | Initial value (change when using a custom domain) |
| --- | --- |
| `ALSM_USER_URL` | `https://user.3-27-190-25.sslip.io` |
| `ALSM_STAFF_URL` | `https://staff.3-27-190-25.sslip.io` |
| `ALSM_WEB3_URL` | `https://web3.3-27-190-25.sslip.io` |
| `ALSM_GOOGLE_CLIENT_ID` | Optional public OAuth client ID if Google login is configured |

URLs are built into each Vite bundle, so changing any URL requires a new deployment. The sslip.io hostnames incorporate the instance's **ephemeral** public IP; an EC2 Stop/Start may break them. Prefer Elastic IP and a registered domain before depending on fully automatic updates.

No SSH key or API password should be committed to a repository. The frontend deployment does not need any AWS access key or MongoDB URI.

## 1. Bootstrap release directories on the EC2 instance (once)

Connect to Ubuntu via SSH as `ubuntu`. Verify the existing sites are healthy before proceeding. Create a **non-sudo** runner account first:

```bash
sudo id alsmrunner >/dev/null 2>&1 || sudo useradd --system --create-home --shell /bin/bash alsmrunner
sudo apt-get update
sudo apt-get install -y rsync curl
```

Next, convert the existing Nginx web directories to links without losing their original content:

```bash
set -eu
for site in user staff web3; do
  base="/var/www/alsm/releases/$site"
  sudo install -d -o alsmrunner -g alsmrunner -m 755 "$base"

  if [ -d "/var/www/alsm/$site" ] && [ ! -L "/var/www/alsm/$site" ]; then
    sudo cp -a "/var/www/alsm/$site" "$base/initial"
    sudo ln -sfn "$base/initial" "$base/current"
    sudo mv "/var/www/alsm/$site" "/var/www/alsm/$site.before-cicd"
    sudo ln -s "$base/current" "/var/www/alsm/$site"
  fi

  test -L "/var/www/alsm/$site"
  test -s "/var/www/alsm/$site/index.html"
  sudo chown alsmrunner:alsmrunner "$base" "$base/current"
done
sudo nginx -t
sudo systemctl reload nginx
```

The original directories are kept as `/var/www/alsm/<site>.before-cicd`. The Nginx configuration files and TLS certificates are not modified. Do not run this script again until reviewing existing directories; if a `before-cicd` directory already exists, stop and inspect to avoid replacing backups.

## 2. Register one restricted self-hosted runner

**Preferred:** Create one *organization-level* self-hosted runner in the GitHub organization `ALSM-Project` and give it access only to the three frontend repositories. Select Linux x64, assign the custom label `alsm-deploy`, and use the installation and registration commands shown by GitHub itself (runner version/download/token are short-lived or change).

On the EC2 host, install the runner under a directory owned by `alsmrunner`, and register/run it under that non-sudo account; do not register or run it as root or the sudo-capable `ubuntu` account. Install the systemd runner service so it starts when EC2 starts. Confirm in GitHub that the runner status is **Idle**.

If organization-level runners are unavailable, each repository needs its own repo-level runner, registered separately (different directories/services), using the same `alsm-deploy` label. A single repo-level runner cannot run jobs from three different repositories.

**Security:** These repositories are public. Self-hosted runners can be dangerous with untrusted PR code. The deploy workflow accepts only `develop` pushes and manual dispatch, but you must protect `develop` from unauthorized merges and protect the `production` Environment (restrict deployment branches to `develop`; optional required reviewers). Do not let unreviewed workflow changes reach `develop`. Dedicated non-sudo account, directory permissions, and restricted runner repository access are essential.

## 3. Enable and test

For each repo, merge its deployment pull request only **after** EC2 bootstrap, GitHub variables, runner access and branch/environment protection are configured.

Then in GitHub → Actions → Deploy ALSM <Portal> to AWS EC2, run `workflow_dispatch` on `develop` to confirm:

- Build job runs on GitHub-hosted runner and uploads `dist`.
- Deploy job runs on EC2 runner and changes the `current` symlink.
- HTTPS GET works and returns 200.

Any later merge/push to `develop` automatically repeats the process for that repository. A frontend deployment does **not** update the Backend or converter JAR/Python. Those require a separate, controlled deployment workflow because of shared MongoDB Atlas, running queues, Java/Python runtime and backend init/seed effects.

## 4. Troubleshooting and rollback

- `Queued` forever: runner Offline, missing `alsm-deploy` label, repository not granted access, or a GitHub Environment approval is pending.
- Build failure: resolve lint/test/Vite errors before deploy; deployed files remain untouched.
- `EC2 portal bootstrap incomplete`: initialize the release symlink.
- Permission denied: `alsmrunner` must own `/var/www/alsm/releases/<site>`; it does not require sudo privileges.
- HTTPS health check fails: workflow attempts to restore the last `current` symlink. If the runner itself fails midway, inspect server manually.
- To manually roll back: find the last good directory in `/var/www/alsm/releases/<site>`; as `alsmrunner`, point `current` to that full path using `ln -sfn` followed by `mv -Tf` (same atomic procedure).

Since the runner is hosted on EC2, a stopped instance cannot deploy. Jobs will queue until the runner comes online. Rotate URL variables and redeploy if instance public IP changes.
