from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .models import UserProfile

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Endpoint: /api/auth/register
    DISABLED: Public registration is closed. Contact Admin.
    """
    return Response({'msg': 'Self-registration is disabled. Please contact your administrator.'}, status=status.HTTP_403_FORBIDDEN)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Endpoint: /api/auth/login
    Expects: { email, password }
    Returns: { token, user: { name, email, role, forcePasswordChange } }
    """
    email = request.data.get('email', request.data.get('username'))
    password = request.data.get('password')

    if not email or not password:
        return Response({'msg': 'Email/Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    # Use a custom authentication block to allow login via email OR username
    user = authenticate(username=email, password=password)
    if not user:
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    if not user:
        return Response({'msg': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    
    # Check for UserProfile to determine force_password_change status
    force_password_change = False
    if hasattr(user, 'profile'):
        force_password_change = user.profile.force_password_change
    
    # Retrieve the dynamically saved role, fallback to email rules if old mock account
    role = 'student'
    if user.last_name in ['student', 'teacher', 'admin', 'parent']:
        role = user.last_name
    elif 'teacher' in user.email.lower(): role = 'teacher'
    elif 'parent' in user.email.lower(): role = 'parent'
    elif 'admin' in user.email.lower(): role = 'admin'

    return Response({
        'token': token.key,
        'user': {
            'name': user.first_name or user.username,
            'email': user.email,
            'role': role,
            'studentId': user.id,
            'forcePasswordChange': force_password_change
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request):
    """
    Endpoint: /api/auth/change-password/
    Expects: { new_password }
    """
    # Manually extract the Token from Bearer header due to frontend formatting
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return Response({'msg': 'Missing or invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        
    token_key = auth_header.split('Bearer ')[1]
    try:
        token = Token.objects.get(key=token_key)
        user = token.user
    except Token.DoesNotExist:
        return Response({'msg': 'Invalid security token'}, status=status.HTTP_401_UNAUTHORIZED)
        
    new_password = request.data.get('new_password')
    
    if not new_password or len(new_password) < 6:
        return Response({'msg': 'New password must be strictly provided (min 6 characters).'}, status=status.HTTP_400_BAD_REQUEST)
        
    user.set_password(new_password)
    user.save()
    
    if hasattr(user, 'profile'):
        user.profile.force_password_change = False
        user.profile.save()
        
    return Response({'msg': 'Password updated successfully!'}, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def profile_me(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return Response({'msg': 'Missing or invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        
    token_key = auth_header.split('Bearer ')[1]
    try:
        token = Token.objects.get(key=token_key)
        user = token.user
    except Token.DoesNotExist:
        return Response({'msg': 'Invalid security token'}, status=status.HTTP_401_UNAUTHORIZED)
        
    role = user.last_name if user.last_name in ['student', 'teacher', 'admin', 'parent'] else 'student'

    if request.method == 'GET':
        profile_data = {}
        if role == 'student' and hasattr(user, 'student_profile'):
            sp = user.student_profile
            profile_data = {
                'gender': sp.gender, 'dob': sp.dob, 'contact_number': sp.contact_number,
                'parent_contact_number': sp.parent_contact_number, 'address': sp.address,
                'admission_date': sp.admission_date, 'standard': sp.standard, 'division': sp.division,
                'subject': sp.subject, 'roll_number': sp.roll_number
            }
        elif role == 'teacher' and hasattr(user, 'teacher_profile'):
            tp = user.teacher_profile
            profile_data = {
                'gender': tp.gender, 'dob': tp.dob, 'contact_number': tp.contact_number,
                'address': tp.address, 'joining_date': tp.joining_date, 'specialization': tp.specialization,
                'standard_handled': tp.standard_handled, 'qualification': tp.qualification,
                'experience': tp.experience, 'employee_id': tp.employee_id
            }
        elif role == 'parent' and hasattr(user, 'parent_profile'):
            pp = user.parent_profile
            profile_data = {
                'contact_number': pp.contact_number, 'address': pp.address, 'occupation': pp.occupation,
                'linked_children': [{'id': c.id, 'name': c.first_name or c.username, 'email': c.email} for c in pp.children.all()]
            }

        return Response({
            'name': user.first_name or user.username,
            'email': user.email,
            'role': role,
            'profile': profile_data
        })
        
    elif request.method == 'PUT':
        data = request.data
        if 'name' in data: user.first_name = data['name']
        if 'email' in data: 
            user.email = data['email']
            user.username = data['email']
        user.save()
        
        pref = data.get('profile', {})
        if role == 'student' and hasattr(user, 'student_profile'):
            sp = user.student_profile
            for field in ['gender', 'contact_number', 'parent_contact_number', 'address', 'standard', 'division', 'subject', 'roll_number']:
                if field in pref: setattr(sp, field, pref[field])
            if 'dob' in pref and pref['dob']: sp.dob = pref['dob']
            if 'admission_date' in pref and pref['admission_date']: sp.admission_date = pref['admission_date']
            sp.save()
        elif role == 'teacher' and hasattr(user, 'teacher_profile'):
            tp = user.teacher_profile
            for field in ['gender', 'contact_number', 'address', 'specialization', 'standard_handled', 'qualification', 'experience', 'employee_id']:
                if field in pref: setattr(tp, field, pref[field])
            if 'dob' in pref and pref['dob']: tp.dob = pref['dob']
            if 'joining_date' in pref and pref['joining_date']: tp.joining_date = pref['joining_date']
            tp.save()
        elif role == 'parent' and hasattr(user, 'parent_profile'):
            pp = user.parent_profile
            for field in ['contact_number', 'address', 'occupation']:
                if field in pref: setattr(pp, field, pref[field])
            pp.save()
            
        return Response({
            'user': {
                'name': user.first_name or user.username,
                'email': user.email,
                'role': role
            }
        })
