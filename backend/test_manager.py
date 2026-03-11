import requests

BASE_URL = "http://localhost:8000/api"

# Login as Admin
login_res = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@courseseller.com", "password": "admin123"}
)
token = login_res.json().get("access_token")
print("Admin Login:", login_res.status_code)

headers = {"Authorization": f"Bearer {token}"}

# List users to find a student
users_res = requests.get(f"{BASE_URL}/admin/users", headers=headers)
print("Users List:", users_res.status_code)

if users_res.status_code == 200:
    users = users_res.json()
    student = next((u for u in users if u["role"] == "student"), None)
    
    if student:
        print(f"Found student: {student['email']} (ID: {student['id']})")
        
        # Change role to manager
        role_res = requests.patch(
            f"{BASE_URL}/admin/users/{student['id']}/role?role=manager",
            headers=headers
        )
        print("Change Role to Manager:", role_res.status_code, role_res.text)
        
        # Test getting permissions
        perms_res = requests.get(
            f"{BASE_URL}/admin/users/{student['id']}/permissions",
            headers=headers
        )
        print("Get Permissions:", perms_res.status_code, perms_res.text)
        
        # Test updating permissions
        update_perms = requests.put(
            f"{BASE_URL}/admin/users/{student['id']}/permissions",
            json={"can_manage_courses": True, "can_manage_categories": True},
            headers=headers
        )
        print("Update Permissions:", update_perms.status_code, update_perms.text)
    else:
        print("No student found to test.")
