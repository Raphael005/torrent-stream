# SSH on Port 2222 — Setup Summary

## Problem
The original command `ssh raphael@localhost -p 2222 -i ~/.ssh/id_rsa` failed because:
1. No SSH service was listening on port 2222
2. The key `~/.ssh/id_rsa` didn't exist

## Solution
Created a custom launchd service for SSH on port 2222.

## Files Created/Modified
- **`/Library/LaunchDaemons/com.local.sshd-2222.plist`** — Custom SSH daemon on port 2222
- **`~/.ssh/authorized_keys`** — Added `id_ed25519_github.pub` for authentication
- **`/etc/ssh/sshd_config`** — Set `Port 2222` (backup at `/etc/ssh/sshd_config.backup`)

## Usage
```zsh
ssh raphael@localhost -p 2222 -i ~/.ssh/id_ed25519_github
```

## Service Management
```zsh
# Stop
sudo launchctl unload /Library/LaunchDaemons/com.local.sshd-2222.plist

# Start
sudo launchctl load /Library/LaunchDaemons/com.local.sshd-2222.plist

# Check status
sudo launchctl list | grep sshd-2222
```

## Notes
- Service auto-starts on boot
- Standard SSH on port 22 remains available via Remote Login (System Settings → Sharing)
