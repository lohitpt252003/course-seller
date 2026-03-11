import requests

url = "http://localhost:8000/api/auth/login"
data = {"email": "admin@courseseller.com", "password": "admin123"}
r = requests.post(url, json=data)
print("Login Status:", r.status_code)

if r.status_code == 200:
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    me_req = requests.get("http://localhost:8000/api/auth/me", headers=headers)
    print("Me:", me_req.text)
    
    r2 = requests.get("http://localhost:8000/api/admin/stats", headers=headers)
    print("Stats Status:", r2.status_code)
    print("Stats Response:", r2.text)
    
    r3 = requests.get("http://localhost:8000/api/admin/users", headers=headers)
    print("Users Status:", r3.status_code)
    print("Users Response:", r3.text[:200]) # only truncate if length > 200
else:
    print("Login Response:", r.text)
