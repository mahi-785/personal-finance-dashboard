"""
Quick seed script: loads database/sample-transactions.csv into the running
API. Handy for demoing the dashboard with realistic data.

Usage (with the backend running on localhost:8000):
    python seed.py
"""
import csv
import os
import urllib.request
import json

API_BASE = "http://localhost:8000"
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "sample-transactions.csv")


def post_transaction(row: dict):
    payload = json.dumps(
        {
            "date": row["date"],
            "description": row["description"],
            "amount": float(row["amount"]),
            "category": row["category"],
            "type": row["type"],
        }
    ).encode()
    req = urllib.request.Request(
        f"{API_BASE}/transactions", data=payload, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status


def main():
    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            post_transaction(row)
            count += 1
    print(f"Seeded {count} transactions.")


if __name__ == "__main__":
    main()
