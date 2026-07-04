# GitHub Webhook Auto-Deployment Setup

This guide shows how to set up automatic deployment without using GitHub Secrets.

## Architecture

Instead of GitHub Actions with SSH, we use:
1. **Webhook Listener** - Python service running on your Azure VM
2. **GitHub Webhook** - Sends push notifications to your server
3. **Deploy Script** - Automatically pulls and redeploys on push to main

## Setup Instructions

### 1. Set Up Webhook Listener on Azure VM

```bash
# SSH into your Azure VM
ssh -i ~/.ssh/uripg_key.pem uripg@40.127.13.42

# Navigate to project
cd ~/transaction_monitor

# Pull latest code (includes webhook scripts)
git pull origin main

# Make scripts executable
chmod +x backend/scripts/deploy.sh
chmod +x backend/scripts/github-webhook-deploy.sh
chmod +x backend/scripts/webhook-listener.py

# Create log directory
sudo mkdir -p /var/log
sudo touch /var/log/github-webhook.log
sudo touch /var/log/github-deploy.log
sudo chown uripg:uripg /var/log/github-*.log

# Generate a secure webhook secret
SECRET=$(openssl rand -hex 32)
echo "Your webhook secret: $SECRET"
# SAVE THIS SECRET - you'll need it for GitHub

# Install systemd service
sudo cp backend/scripts/github-webhook.service /etc/systemd/system/
sudo sed -i "s/your-secret-here-change-this/$SECRET/" /etc/systemd/system/github-webhook.service

# Start webhook listener
sudo systemctl daemon-reload
sudo systemctl enable github-webhook
sudo systemctl start github-webhook

# Check status
sudo systemctl status github-webhook

# View logs
sudo journalctl -u github-webhook -f
```

### 2. Open Firewall Port

```bash
# Azure VM - Allow port 9000
sudo ufw allow 9000/tcp
sudo ufw status
```

### 3. Configure Azure Network Security Group

In Azure Portal:
1. Go to your VM → Networking → Network Settings
2. Add inbound rule:
   - Port: 9000
   - Protocol: TCP
   - Source: Any (or GitHub's IP ranges for better security)
   - Name: `AllowGitHubWebhook`

### 4. Configure GitHub Webhook

1. Go to your GitHub repository: https://github.com/TheSoftNode/transaction_monitor
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://40.127.13.42:9000`
   - **Content type**: `application/json`
   - **Secret**: (paste the secret you generated above)
   - **Which events**: Select "Just the push event"
   - **Active**: ✓ Checked

4. Click **Add webhook**

### 5. Test the Setup

```bash
# Make a test change locally
echo "# Test webhook" >> README.md
git add README.md
git commit -m "Test webhook deployment"
git push origin main

# On Azure VM, watch the deployment happen
ssh -i ~/.ssh/uripg_key.pem uripg@40.127.13.42
sudo journalctl -u github-webhook -f

# OR watch deployment logs
tail -f /var/log/github-deploy.log
```

## How It Works

1. You push code to `main` branch
2. GitHub sends POST request to `http://40.127.13.42:9000`
3. Webhook listener verifies signature and triggers deployment
4. Deploy script:
   - Pulls latest code
   - Rebuilds Docker images
   - Restarts backend and event-processor
   - Runs health checks

## Manual Deployment

You can also deploy manually:

```bash
ssh -i ~/.ssh/uripg_key.pem uripg@40.127.13.42
cd ~/transaction_monitor
./backend/scripts/deploy.sh
```

## Troubleshooting

### Check webhook listener status
```bash
sudo systemctl status github-webhook
sudo journalctl -u github-webhook --since "10 minutes ago"
```

### Check deployment logs
```bash
tail -f /var/log/github-deploy.log
```

### Test webhook endpoint
```bash
curl http://40.127.13.42:9000
# Should return: "Webhook listener is running"
```

### Restart webhook listener
```bash
sudo systemctl restart github-webhook
```

### View recent GitHub webhook deliveries
Go to: GitHub Repo → Settings → Webhooks → Click your webhook → Recent Deliveries

## Security Notes

- Webhook secret is verified using HMAC-SHA256
- Only push events to `main` branch trigger deployment
- Deploy script runs as `uripg` user (not root)
- Logs are stored in `/var/log/` for audit trail

## Benefits Over GitHub Actions

✅ No SSH key in GitHub
✅ No GitHub secrets needed
✅ Faster deployment (no CI runner spin-up)
✅ Full control over deployment process
✅ Easy to debug with local logs
✅ Works even if GitHub Actions is down
