import requests
try:
    resp = requests.delete("http://localhost:5000/api/skill-gap/roadmap?email=test@example.com", timeout=5)
    print(f"Status: {resp.status_code}")
    print(f"Message: {resp.json()}")
except Exception as e:
    print(f"Error: {e}")
