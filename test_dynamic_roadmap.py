import requests
import json

payload = {
    "role": "Data Scientist",
    "currentSkills": "Python, SQL",
    "email": "test_dynamic@example.com"
}

try:
    print("Sending request... (this may take 10-20s)")
    resp = requests.post("http://localhost:5000/api/skill-gap/generate", json=payload, timeout=60)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Role: {data.get('role')}")
        print(f"Missing Skills: {data.get('missingSkills')}")
        plan = data.get('closurePlan', [])
        print(f"Plan Items: {len(plan)}")
        if plan:
            print("First Item Sample:")
            print(json.dumps(plan[0], indent=2))
    else:
        print(f"Error: {resp.status_code} - {resp.text}")
except Exception as e:
    print(f"Exception: {e}")
