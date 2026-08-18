import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hms_project.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.contrib.auth.hashers import make_password

User = get_user_model()
email = 'doctor@example.com'
password = 'DoctorPass123!'
user, created = User.objects.get_or_create(
    email=email,
    defaults={'username': 'doctor1', 'role': 'doctor', 'first_name': 'Doc', 'last_name': 'Tori'}
)
if created:
    user.password = make_password(password)
    user.save()

client = APIClient()
# Login to get tokens
resp = client.post('/api/accounts/login/', {'email': email, 'password': password}, format='json')
print('LOGIN STATUS', resp.status_code)
print(resp.json() if resp.status_code==200 else resp.content)
if resp.status_code != 200:
    print('Login failed; cannot test doctor endpoints')
else:
    access = resp.json().get('access')
    # Use HTTP Authorization header
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
    p = client.get('/api/doctors/me/profile/')
    d = client.get('/api/doctors/dashboard/')
    print('/api/doctors/me/profile/ ->', p.status_code)
    try:
        print(p.json())
    except Exception as e:
        print('profile json error', e, p.content)
    print('/api/doctors/dashboard/ ->', d.status_code)
    try:
        print(d.json())
    except Exception as e:
        print('dashboard json error', e, d.content)
