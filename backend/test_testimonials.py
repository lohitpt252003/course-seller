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

# Test creating a testimonial
testimonial_data = {
    "name": "Rahul Sharma",
    "role": "Software Engineer at Google",
    "quote": "This platform transformed my career. The courses were incredibly well-structured and the mentorship was invaluable.",
    "photo_url": "https://randomuser.me/api/portraits/men/1.jpg"
}
create_res = requests.post(f"{BASE_URL}/testimonials/", json=testimonial_data, headers=headers)
print("Create Testimonial:", create_res.status_code, create_res.text[:200])

# Create second
testimonial_data2 = {
    "name": "Priya Patel",
    "role": "Data Scientist at Microsoft",
    "quote": "The hands-on projects and expert guidance helped me land my dream job. Highly recommend!"
}
create_res2 = requests.post(f"{BASE_URL}/testimonials/", json=testimonial_data2, headers=headers)
print("Create Testimonial 2:", create_res2.status_code, create_res2.text[:200])

# Create third
testimonial_data3 = {
    "name": "Arjun Verma",
    "role": "Full Stack Developer at Amazon",
    "quote": "From zero coding experience to a full-time dev role in 6 months. The structured learning path was exactly what I needed.",
    "photo_url": "https://randomuser.me/api/portraits/men/3.jpg"
}
create_res3 = requests.post(f"{BASE_URL}/testimonials/", json=testimonial_data3, headers=headers)
print("Create Testimonial 3:", create_res3.status_code, create_res3.text[:200])

# Fetch all (public)
list_res = requests.get(f"{BASE_URL}/testimonials/")
print("\nPublic List:", list_res.status_code)
print(f"Total testimonials: {len(list_res.json())}")
for t in list_res.json():
    print(f"  - {t['name']} ({t['role']})")
