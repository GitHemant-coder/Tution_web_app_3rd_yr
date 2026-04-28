from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import (
    UserProfile, StudentPerformance, StudentProfile, TeacherProfile,
    ParentProfile, Notification, Payment, TeacherStudentAssignment
)
from django.utils import timezone
from rest_framework.authtoken.models import Token


# ─────────────────────────────────────────────────────────────────────────────
# Auth helpers — DRF's TokenAuthentication expects "Token <key>",
# but the React frontend sends "Bearer <key>".  This helper handles both.
# ─────────────────────────────────────────────────────────────────────────────

def get_user_from_request(request):
    """Extract authenticated user from Authorization: Bearer <token> header."""
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        key = auth[7:].strip()
        try:
            return Token.objects.get(key=key).user
        except Token.DoesNotExist:
            return None
    # Fallback: DRF may have already populated request.user via TokenAuthentication
    if hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    return None


def get_role(user):
    """Determine user role from last_name field (set at creation) or email heuristics."""
    if user is None:
        return 'student'
    role = user.last_name if user.last_name in ['student', 'teacher', 'admin', 'parent'] else ''
    if not role:
        email = user.email.lower()
        if 'admin' in email:
            role = 'admin'
        elif 'teacher' in email:
            role = 'teacher'
        elif 'parent' in email:
            role = 'parent'
        else:
            role = 'student'
    return role


def is_admin(user):
    if user is None:
        return False
    return get_role(user) == 'admin' or user.is_staff or user.is_superuser


class IsAdminRole(BasePermission):
    """
    Accepts 'Bearer <token>' (React frontend) in addition to 'Token <token>' (DRF default).
    This is the single most critical fix — without it, request.user is always
    AnonymousUser when frontend sends Bearer tokens, causing a 403 on every admin endpoint.
    """
    def has_permission(self, request, view):
        user = get_user_from_request(request)
        return is_admin(user)


# ─────────────────────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def manage_users(request):
    if request.method == 'GET':
        users = User.objects.all()
        data = []
        for u in users:
            role = get_role(u)
            profile_data = {'contact_number': '', 'address': ''}

            try:
                if role == 'student' and hasattr(u, 'student_profile'):
                    sp = u.student_profile
                    profile_data = {
                        'gender': sp.gender or '',
                        'dob': str(sp.dob) if sp.dob else '',
                        'contact_number': sp.contact_number or '',
                        'parent_contact_number': sp.parent_contact_number or '',
                        'address': sp.address or '',
                        'admission_date': str(sp.admission_date) if sp.admission_date else '',
                        'standard': sp.standard or '',
                        'division': sp.division or '',
                        'subject': sp.subject or '',
                        'roll_number': sp.roll_number or ''
                    }
                elif role == 'teacher' and hasattr(u, 'teacher_profile'):
                    tp = u.teacher_profile
                    profile_data = {
                        'gender': tp.gender or '',
                        'dob': str(tp.dob) if tp.dob else '',
                        'contact_number': tp.contact_number or '',
                        'address': tp.address or '',
                        'joining_date': str(tp.joining_date) if tp.joining_date else '',
                        'specialization': tp.specialization or '',
                        'standard_handled': tp.standard_handled or '',
                        'qualification': tp.qualification or '',
                        'experience': tp.experience or '',
                        'employee_id': tp.employee_id or ''
                    }
                elif role == 'parent' and hasattr(u, 'parent_profile'):
                    pp = u.parent_profile
                    profile_data = {
                        'contact_number': pp.contact_number or '',
                        'address': pp.address or '',
                        'occupation': pp.occupation or ''
                    }
            except Exception:
                pass  # If profile row somehow missing, return empty profile_data

            children = []
            try:
                if role == 'parent' and hasattr(u, 'parent_profile'):
                    children = [
                        {'id': c.id, 'name': c.first_name or c.username}
                        for c in u.parent_profile.children.all()
                    ]
            except Exception:
                pass

            data.append({
                '_id': u.id,
                'name': u.first_name or u.username,
                'username': u.username,
                'email': u.email,
                'role': role,
                'profile': profile_data,
                'createdAt': u.date_joined.isoformat(),
                'children': children
            })
        return Response(data)

    elif request.method == 'POST':
        data = request.data
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        # username: if provided use it, otherwise fall back to email
        username = data.get('username', '').strip() or email
        password = data.get('password', '').strip()
        role = data.get('role', 'student')

        if not email or not password or not name:
            return Response({'msg': 'Name, email, and password are required'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'msg': 'A user with this email already exists'}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({'msg': f'Username "{username}" is already taken. Please choose another.'}, status=400)

        user = User.objects.create_user(
            username=username, email=email, password=password,
            first_name=name, last_name=role
        )

        # Force password change on first login
        UserProfile.objects.create(user=user, force_password_change=True)

        # Create role-specific profile
        if role == 'student':
            StudentProfile.objects.create(
                user=user,
                gender=data.get('gender') or '',
                dob=data.get('dob') or None,
                contact_number=data.get('contact_number') or '',
                parent_contact_number=data.get('parent_contact_number') or '',
                address=data.get('address') or '',
                admission_date=data.get('admission_date') or None,
                standard=data.get('standard') or '',
                division=data.get('division') or '',
                subject=data.get('subject') or '',
                roll_number=data.get('roll_number') or ''
            )
        elif role == 'teacher':
            TeacherProfile.objects.create(
                user=user,
                gender=data.get('gender') or '',
                dob=data.get('dob') or None,
                contact_number=data.get('contact_number') or '',
                address=data.get('address') or '',
                joining_date=data.get('joining_date') or None,
                specialization=data.get('specialization') or '',
                standard_handled=data.get('standard_handled') or '',
                qualification=data.get('qualification') or '',
                experience=data.get('experience') or '',
                employee_id=data.get('employee_id') or ''
            )
        elif role == 'parent':
            parent_profile = ParentProfile.objects.create(
                user=user,
                contact_number=data.get('contact_number') or '',
                address=data.get('address') or '',
                occupation=data.get('occupation') or ''
            )
            linked_student_id = data.get('linked_student')
            if linked_student_id:
                try:
                    student = User.objects.get(id=linked_student_id)
                    parent_profile.children.add(student)
                except User.DoesNotExist:
                    pass

        return Response(
            {'msg': 'User created successfully', 'user': {'_id': user.id, 'name': user.first_name, 'username': user.username, 'role': role}},
            status=201
        )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminRole])
def manage_user_detail(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'msg': 'User not found'}, status=404)

    if request.method == 'DELETE':
        user.delete()
        return Response({'msg': 'User deleted successfully'}, status=200)

    elif request.method == 'PUT':
        data = request.data
        if 'name' in data:
            user.first_name = data['name']
        if 'email' in data and data['email']:
            new_email = data['email'].strip()
            if new_email != user.email and User.objects.filter(email=new_email).exclude(id=user.id).exists():
                return Response({'msg': 'That email is already in use'}, status=400)
            user.email = new_email
        if 'username' in data and data['username']:
            new_uname = data['username'].strip()
            if new_uname != user.username and User.objects.filter(username=new_uname).exclude(id=user.id).exists():
                return Response({'msg': f'Username "{new_uname}" is already taken'}, status=400)
            user.username = new_uname
        role = user.last_name
        if 'role' in data:
            user.last_name = data['role']
            role = user.last_name
        user.save()

        try:
            if role == 'student' and hasattr(user, 'student_profile'):
                profile = user.student_profile
                for field in ['gender', 'contact_number', 'parent_contact_number', 'address', 'standard', 'division', 'subject', 'roll_number']:
                    if field in data:
                        setattr(profile, field, data[field])
                if 'dob' in data and data['dob']:
                    profile.dob = data['dob']
                if 'admission_date' in data and data['admission_date']:
                    profile.admission_date = data['admission_date']
                profile.save()

            elif role == 'teacher' and hasattr(user, 'teacher_profile'):
                profile = user.teacher_profile
                for field in ['gender', 'contact_number', 'address', 'specialization', 'standard_handled', 'qualification', 'experience', 'employee_id']:
                    if field in data:
                        setattr(profile, field, data[field])
                if 'dob' in data and data['dob']:
                    profile.dob = data['dob']
                if 'joining_date' in data and data['joining_date']:
                    profile.joining_date = data['joining_date']
                profile.save()

            elif role == 'parent' and hasattr(user, 'parent_profile'):
                profile = user.parent_profile
                for field in ['contact_number', 'address', 'occupation']:
                    if field in data:
                        setattr(profile, field, data[field])
                profile.save()
        except Exception as e:
            pass  # Profile update failure is non-critical — base user is already saved

        return Response({'msg': 'User updated successfully'}, status=200)


# ─────────────────────────────────────────────────────────────────────────────
# Parent-Student Linking
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAdminRole])
def link_child(request):
    parent_id = request.data.get('parentId')
    student_id = request.data.get('studentId')
    try:
        parent = User.objects.get(id=parent_id)
        student = User.objects.get(id=student_id)
        if hasattr(parent, 'parent_profile'):
            parent.parent_profile.children.add(student)
            return Response({'message': 'Child linked successfully!'})
        else:
            return Response({'msg': 'Parent profile not found on this user'}, status=404)
    except User.DoesNotExist:
        return Response({'msg': 'Parent or Student not found'}, status=404)


# ─────────────────────────────────────────────────────────────────────────────
# Admin Stats / Overview
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminRole])
def get_admin_stats(request):
    users = User.objects.all()

    total_students = 0
    total_teachers = 0
    total_parents = 0
    total_admins = 0

    for u in users:
        role = get_role(u)
        if role == 'student':
            total_students += 1
        elif role == 'teacher':
            total_teachers += 1
        elif role == 'parent':
            total_parents += 1
        elif role == 'admin':
            total_admins += 1

    pending_payments_count = Payment.objects.filter(status='pending').count()
    total_assignments = TeacherStudentAssignment.objects.count()
    total_notifications = Notification.objects.count()

    return Response({
        'totalStudents': total_students,
        'totalTeachers': total_teachers,
        'totalParents': total_parents,
        'totalAdmins': total_admins,
        'pendingPayments': pending_payments_count,
        'totalAssignments': total_assignments,
        'totalNotifications': total_notifications
    })


# ─────────────────────────────────────────────────────────────────────────────
# Performance
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def manage_performance(request):
    if request.method == 'GET':
        records = StudentPerformance.objects.all().select_related('student').order_by('-created_at')
        data = []
        for r in records:
            data.append({
                '_id': r.id,
                'student': {'_id': r.student.id, 'name': r.student.first_name or r.student.username},
                'subject': r.subject,
                'score': r.score,
                'maxScore': r.max_score,
                'percentage': round((r.score / r.max_score) * 100, 2) if r.max_score > 0 else 0,
                'remarks': r.remarks or '',
                'createdAt': r.created_at.isoformat()
            })
        return Response(data)

    elif request.method == 'POST':
        student_id = request.data.get('student')
        subject = request.data.get('subject', '').strip()
        try:
            score = float(request.data.get('score', 0))
            max_score = float(request.data.get('maxScore', 0))
        except (ValueError, TypeError):
            return Response({'error': 'Scores must be valid numbers'}, status=status.HTTP_400_BAD_REQUEST)

        remarks = request.data.get('remarks', '')

        if not student_id or not subject:
            return Response({'msg': 'Student and subject are required'}, status=status.HTTP_400_BAD_REQUEST)
        if max_score <= 0:
            return Response({'msg': 'Max score must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
        if score > max_score:
            return Response({'msg': 'Score cannot exceed max score'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'msg': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        record = StudentPerformance(
            student=student, subject=subject,
            score=score, max_score=max_score, remarks=remarks
        )
        record.save()
        return Response({'msg': 'Performance record saved successfully'}, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminRole])
def manage_performance_detail(request, record_id):
    try:
        record = StudentPerformance.objects.get(id=record_id)
    except StudentPerformance.DoesNotExist:
        return Response({'msg': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        record.delete()
        return Response({'msg': 'Record deleted successfully'}, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        student_id = request.data.get('student')
        subject = request.data.get('subject', '').strip()
        try:
            score = float(request.data.get('score', 0))
            max_score = float(request.data.get('maxScore', 0))
        except (ValueError, TypeError):
            return Response({'error': 'Scores must be valid numbers'}, status=status.HTTP_400_BAD_REQUEST)

        remarks = request.data.get('remarks', '')

        if not student_id or not subject or max_score <= 0 or score > max_score:
            return Response({'msg': 'Invalid input data'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'msg': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        record.student = student
        record.subject = subject
        record.score = score
        record.max_score = max_score
        record.remarks = remarks
        record.save()
        return Response({'msg': 'Record updated successfully'}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# Students (lightweight list for dropdowns)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_students(request):
    """Lightweight endpoint — returns only students for dropdowns."""
    data = []
    for u in User.objects.all():
        if get_role(u) == 'student':
            data.append({'_id': u.id, 'name': u.first_name or u.username})
    return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def manage_notifications(request):
    if request.method == 'GET':
        notifications = Notification.objects.all().order_by('-created_at')
        data = []
        for n in notifications:
            data.append({
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'type': n.type,
                'recipient_type': n.recipient_type,
                'specific_user': n.specific_user.username if n.specific_user else None,
                'is_important': n.is_important,
                'created_at': n.created_at.isoformat(),
                'reads': n.read_by.count()
            })
        return Response(data)

    elif request.method == 'POST':
        data = request.data
        title = data.get('title', '').strip()
        message = data.get('message', '').strip()
        n_type = data.get('type', 'Information')
        recipient_type = data.get('recipient_type', 'All Users')
        specific_user_id = data.get('specific_user')
        is_important = data.get('is_important', False)

        if not title or not message:
            return Response({'msg': 'Title and message are required'}, status=400)

        specific_user = None
        if recipient_type == 'Specific User' and specific_user_id:
            try:
                specific_user = User.objects.get(id=specific_user_id)
            except User.DoesNotExist:
                return Response({'msg': 'Target user not found'}, status=404)

        created_by = get_user_from_request(request)

        notif = Notification.objects.create(
            title=title,
            message=message,
            type=n_type,
            recipient_type=recipient_type,
            specific_user=specific_user,
            is_important=is_important,
            created_by=created_by
        )

        return Response({'msg': 'Notification broadcasted successfully!', 'id': notif.id}, status=201)


# ─────────────────────────────────────────────────────────────────────────────
# Assignments
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def manage_assignments(request):
    if request.method == 'GET':
        assignments = TeacherStudentAssignment.objects.all().select_related('teacher', 'student').order_by('-assigned_at')
        data = []
        for a in assignments:
            data.append({
                'id': a.id,
                'teacher_id': a.teacher.id,
                'teacher_name': a.teacher.first_name or a.teacher.username,
                'student_id': a.student.id,
                'student_name': a.student.first_name or a.student.username,
                'subjects': a.subjects or '',
                'assigned_at': a.assigned_at.isoformat()
            })
        return Response(data)

    elif request.method == 'POST':
        data = request.data
        teacher_id = data.get('teacherId')
        student_id = data.get('studentId')
        subjects = data.get('subjects', '')

        if isinstance(subjects, list):
            subjects = ', '.join(subjects)

        if not teacher_id or not student_id:
            return Response({'msg': 'Teacher and Student IDs are required'}, status=400)

        try:
            teacher = User.objects.get(id=teacher_id)
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'msg': 'Teacher or Student not found'}, status=404)

        a, created = TeacherStudentAssignment.objects.update_or_create(
            teacher=teacher,
            student=student,
            defaults={'subjects': subjects}
        )
        return Response({'msg': 'Assignment saved!', 'id': a.id}, status=201 if created else 200)


@api_view(['DELETE'])
@permission_classes([IsAdminRole])
def delete_assignment(request, assign_id):
    try:
        a = TeacherStudentAssignment.objects.get(id=assign_id)
        a.delete()
        return Response({'msg': 'Assignment removed'})
    except TeacherStudentAssignment.DoesNotExist:
        return Response({'msg': 'Assignment not found'}, status=404)


# ─────────────────────────────────────────────────────────────────────────────
# Payments
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAdminRole])
def manage_payments(request):
    if request.method == 'GET':
        payments = Payment.objects.all().select_related('student').order_by('-created_at')
        data = []
        for p in payments:
            data.append({
                '_id': p.id,
                'student': {'name': p.student.first_name or p.student.username},
                'amount': str(p.amount),
                'timing': p.month,
                'status': p.status,
                'created_at': p.created_at.isoformat()
            })
        return Response(data)

    elif request.method == 'POST':
        data = request.data
        student_id = data.get('student')
        amount = data.get('amount')
        month = data.get('month', '')

        if not student_id or not amount or not month:
            return Response({'msg': 'Student, amount, and month are required'}, status=400)

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'msg': 'Student not found'}, status=404)

        p = Payment.objects.create(student=student, amount=amount, month=month, status='pending')
        return Response({'msg': 'Payment record added', 'id': p.id}, status=201)


@api_view(['PUT'])
@permission_classes([IsAdminRole])
def update_payment(request, payment_id):
    try:
        payment = Payment.objects.get(id=payment_id)
        status_val = request.data.get('status')
        if status_val:
            payment.status = status_val
            payment.save()
        return Response({'msg': 'Payment updated successfully'})
    except Payment.DoesNotExist:
        return Response({'msg': 'Payment not found'}, status=404)
