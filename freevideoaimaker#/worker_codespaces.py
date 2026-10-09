#!/usr/bin/env python3
"""
FreeVideoAIMaker - GitHub Codespaces Cloud Worker
==================================================
Runs in GitHub Codespaces 24/7 to process video generation tasks from your Render site.

Usage:
  python worker_codespaces.py --server https://your-app.onrender.com
"""

import time
import requests
import argparse
import sys
import os

# Parse command line arguments
parser = argparse.ArgumentParser(description="FreeVideoAIMaker Codespaces Worker")
parser.add_argument(
    "--server",
    default=os.environ.get("RENDER_SERVER_URL", "https://freevideoaimaker.onrender.com"),
    help="Your Render Web Service URL (e.g. https://freevideoaimaker.onrender.com)"
)
parser.add_argument(
    "--poll-interval",
    type=int,
    default=4,
    help="Polling interval in seconds (default: 4s)"
)
args = parser.parse_args()

SERVER_URL = args.server.rstrip("/")
HEADERS = {
    "User-Agent": "GitHub-Codespaces-Worker-v2.4",
    "x-worker-node": "github-codespaces-cloud-gpu",
    "Content-Type": "application/json"
}

print("=" * 65)
print(" FreeVideoAIMaker - GitHub Codespaces Neural Worker")
print(f" Target Host: {SERVER_URL}")
print(f" Poll Interval: {args.poll_interval}s")
print("=" * 65)

def check_server_health():
    try:
        r = requests.get(f"{SERVER_URL}/api/health", headers=HEADERS, timeout=10)
        if r.status_code == 200:
            print("[+] Server connection verified:", r.json().get("status", "ok"))
            return True
        else:
            print(f"[!] Server responded with status code: {r.status_code}")
            return False
    except Exception as e:
        print(f"[-] Could not connect to {SERVER_URL}: {e}")
        return False

def pull_next_task():
    try:
        r = requests.get(f"{SERVER_URL}/api/videos/next-pending", headers=HEADERS, timeout=15)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"[!] Polling error: {e}")
    return None

def update_task_status(task_id, status, video_url=None, thumbnail_url=None, error=None):
    payload = {
        "id": task_id,
        "status": status,
        "workerNode": "github-codespaces",
    }
    if video_url:
        payload["videoUrl"] = video_url
    if thumbnail_url:
        payload["thumbnailUrl"] = thumbnail_url
    if error:
        payload["error"] = error

    try:
        r = requests.post(f"{SERVER_URL}/api/videos/update-status", json=payload, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            print(f"[+] Task {task_id} successfully marked as {status} on server.")
            return True
        else:
            print(f"[-] Failed to update task: {r.text}")
    except Exception as e:
        print(f"[-] Update network error: {e}")
    return False

def render_neural_video(task):
    """
    Simulates or executes your neural model rendering in Codespaces.
    Replace with your local Diffusers / Stable Video Diffusion / CogVideo pipeline.
    """
    task_id = task.get("id")
    prompt = task.get("prompt")
    duration = task.get("duration", 5)
    print(f"\n[*] Processing Order {task_id}...")
    print(f"    Prompt: {prompt}")
    print(f"    Duration: {duration}s | Style: {task.get('style')}")

    # Simulated neural rendering steps (e.g. 6-10s)
    # You can plug in:
    #   pipe = StableVideoDiffusionPipeline.from_pretrained(...)
    #   video_frames = pipe(image).frames[0]
    time.sleep(6)

    # Deliver output MP4 stream
    sample_videos = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    ]
    hash_num = sum(ord(c) for c in prompt) if prompt else 0
    final_video_url = sample_videos[hash_num % len(sample_videos)]
    return final_video_url

def main():
    print("[*] Starting task listener...")
    while True:
        task_data = pull_next_task()
        if task_data and task_data.get("pending"):
            task = task_data.get("task", {})
            task_id = task.get("id")
            try:
                video_url = render_neural_video(task)
                update_task_status(task_id, "completed", video_url=video_url)
            except Exception as e:
                print(f"[!] Error rendering {task_id}: {e}")
                update_task_status(task_id, "failed", error=str(e))
        else:
            # Idle wait
            sys.stdout.write(".")
            sys.stdout.flush()
        
        time.sleep(args.poll_interval)

if __name__ == "__main__":
    check_server_health()
    main()
