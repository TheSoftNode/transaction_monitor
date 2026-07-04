#!/usr/bin/env python3
"""
Simple GitHub webhook listener for auto-deployment
Runs on port 9000 and triggers deployment when push to main is detected
"""

import hmac
import hashlib
import subprocess
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import logging

# Configuration
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "your-webhook-secret-change-this")
DEPLOY_SCRIPT = os.path.expanduser(
    "~/transaction_monitor/backend/scripts/github-webhook-deploy.sh"
)
PORT = 9000

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("/var/log/github-webhook.log"),
        logging.StreamHandler(),
    ],
)


class WebhookHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        logging.info(f"{self.address_string()} - {format % args}")

    def verify_signature(self, payload, signature):
        """Verify GitHub webhook signature"""
        if not signature:
            return False

        sha_name, signature = signature.split("=")
        if sha_name != "sha256":
            return False

        mac = hmac.new(WEBHOOK_SECRET.encode(), msg=payload, digestmod=hashlib.sha256)
        return hmac.compare_digest(mac.hexdigest(), signature)

    def do_POST(self):
        """Handle POST requests from GitHub"""
        content_length = int(self.headers["Content-Length"])
        payload = self.rfile.read(content_length)
        signature = self.headers.get("X-Hub-Signature-256", "")
        event = self.headers.get("X-GitHub-Event", "")

        # Verify signature
        if not self.verify_signature(payload, signature):
            logging.warning(f"Invalid signature from {self.client_address[0]}")
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Invalid signature")
            return

        # Parse payload
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            logging.error("Invalid JSON payload")
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Invalid JSON")
            return

        # Only handle push events to main branch
        if event == "push" and data.get("ref") == "refs/heads/main":
            logging.info(f"Push to main detected - Triggering deployment")

            try:
                # Run deployment script in background
                subprocess.Popen(
                    ["/bin/bash", DEPLOY_SCRIPT],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )

                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"Deployment triggered")
                logging.info("Deployment script started successfully")
            except Exception as e:
                logging.error(f"Failed to trigger deployment: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b"Deployment failed")
        else:
            logging.info(f"Ignoring {event} event")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Event ignored")

    def do_GET(self):
        """Health check endpoint"""
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Webhook listener is running")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    logging.info(f"🚀 GitHub webhook listener started on port {PORT}")
    logging.info(f"📝 Deploy script: {DEPLOY_SCRIPT}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logging.info("Shutting down webhook listener")
        server.shutdown()
