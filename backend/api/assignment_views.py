"""
assignment_views.py — Assignment Submission endpoints.

Teacher endpoints:
  GET/POST  /api/assignments/                          — list own / create assignment (with PDF)
  DELETE    /api/assignments/<id>/delete/              — delete an assignment
  GET       /api/assignments/<id>/submissions/         — see all student submissions for one assignment

Student endpoints:
  GET       /api/assignments/student/                  — list all assignments + own submission status
  POST      /api/assignments/<id>/submit/              — upload answer PDF (or re-submit before deadline)

File download (PUBLIC — no auth token required):
  GET       /api/assignments/<id>/pdf/                 — download teacher's question PDF
  GET       /api/submissions/<id>/pdf/                 — download a specific student submission PDF
"""

import os
from django.utils import timezone
from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Assignment, AssignmentSubmission
from .admin_views import get_user_from_request, get_role


def _auth(request):
    """Extract authenticated user. Returns (user, None) or (None, error_response)."""
    user = get_user_from_request(request)
    if not user:
        return None, Response({'msg': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    return user, None


def _assignment_dict(a, student=None):
    """Serialize one Assignment. If student is given, include their submission status."""
    now = timezone.now()
    is_past_deadline = now > a.deadline

    result = {
        'id': a.id,
        'title': a.title,
        'description': a.description or '',
        'deadline': a.deadline.isoformat(),
        'is_past_deadline': is_past_deadline,
        'teacher_name': a.teacher.first_name or a.teacher.username,
        'created_at': a.created_at.isoformat(),
        'pdf_url': f'/assignments/{a.id}/pdf/',
        'submission_count': a.submissions.count(),
    }

    if student:
        try:
            sub = a.submissions.get(student=student)
            result['submission'] = {
                'id': sub.id,
                'submitted_at': sub.submitted_at.isoformat(),
                'pdf_url': f'/submissions/{sub.id}/pdf/',
                'status': 'submitted',
            }
        except AssignmentSubmission.DoesNotExist:
            result['submission'] = None
            result['submission_status'] = 'overdue' if is_past_deadline else 'pending'

    return result


# ─── Teacher: Create & List Assignments ──────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def assignment_list_create(request):
    """GET — teacher sees their own assignments. POST — teacher creates a new assignment."""
    user, err = _auth(request)
    if err:
        return err

    role = get_role(user)

    if request.method == 'GET':
        if role == 'teacher':
            assignments = Assignment.objects.filter(teacher=user).order_by('-created_at')
        else:
            assignments = Assignment.objects.all().order_by('-created_at')

        return Response([_assignment_dict(a) for a in assignments])

    # POST — create assignment
    if role != 'teacher':
        return Response({'msg': 'Only teachers can create assignments'}, status=403)

    title = request.data.get('title', '').strip()
    description = request.data.get('description', '').strip()
    deadline_str = request.data.get('deadline', '').strip()
    pdf_file = request.FILES.get('pdf')

    if not title:
        return Response({'msg': 'Title is required'}, status=400)
    if not deadline_str:
        return Response({'msg': 'Deadline is required'}, status=400)
    if not pdf_file:
        return Response({'msg': 'Assignment PDF is required'}, status=400)

    try:
        from django.utils.dateparse import parse_datetime
        deadline = parse_datetime(deadline_str)
        if deadline is None:
            raise ValueError("bad format")
        if timezone.is_naive(deadline):
            deadline = timezone.make_aware(deadline)
    except Exception:
        return Response({'msg': 'Invalid deadline format. Use ISO 8601 e.g. 2025-12-31T23:59'}, status=400)

    assignment = Assignment.objects.create(
        teacher=user,
        title=title,
        description=description,
        deadline=deadline,
        pdf=pdf_file,
    )

    return Response({'msg': 'Assignment created!', 'id': assignment.id}, status=201)


# ─── Teacher: Delete an Assignment ───────────────────────────────────────────

@api_view(['DELETE'])
@permission_classes([AllowAny])
def assignment_delete(request, assignment_id):
    """Teacher deletes their own assignment."""
    user, err = _auth(request)
    if err:
        return err

    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response({'msg': 'Assignment not found'}, status=404)

    if assignment.teacher != user and not user.is_staff:
        return Response({'msg': 'You can only delete your own assignments'}, status=403)

    if assignment.pdf and os.path.isfile(assignment.pdf.path):
        os.remove(assignment.pdf.path)

    assignment.delete()
    return Response({'msg': 'Assignment deleted'})


# ─── Teacher: See All Submissions for One Assignment ─────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def assignment_submissions(request, assignment_id):
    """Teacher sees all student submissions for one assignment."""
    user, err = _auth(request)
    if err:
        return err

    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response({'msg': 'Assignment not found'}, status=404)

    subs = assignment.submissions.select_related('student').order_by('submitted_at')
    data = []
    for s in subs:
        data.append({
            'id': s.id,
            'student_name': s.student.first_name or s.student.username,
            'student_username': s.student.username,
            'submitted_at': s.submitted_at.isoformat(),
            'pdf_url': f'/submissions/{s.id}/pdf/',
        })

    return Response({
        'assignment': _assignment_dict(assignment),
        'submissions': data,
    })


# ─── Student: List Assignments With Submission Status ────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def student_assignments(request):
    """Student sees all published assignments with their own submission status."""
    user, err = _auth(request)
    if err:
        return err

    assignments = Assignment.objects.all().order_by('-created_at')
    data = []
    for a in assignments:
        d = _assignment_dict(a, student=user)
        if d.get('submission'):
            d['submission_status'] = 'submitted'
        elif not d.get('submission_status'):
            d['submission_status'] = 'pending'
        data.append(d)

    return Response(data)


# ─── Student: Submit (or Re-submit) Assignment ───────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def student_submit(request, assignment_id):
    """Student uploads their answer PDF. Re-submits replace the old file."""
    user, err = _auth(request)
    if err:
        return err

    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response({'msg': 'Assignment not found'}, status=404)

    if timezone.now() > assignment.deadline:
        return Response({'msg': 'Deadline has passed. Submissions are closed.'}, status=400)

    pdf_file = request.FILES.get('pdf')
    if not pdf_file:
        return Response({'msg': 'Please attach your answer PDF'}, status=400)

    try:
        existing = AssignmentSubmission.objects.get(assignment=assignment, student=user)
        if existing.pdf and os.path.isfile(existing.pdf.path):
            os.remove(existing.pdf.path)
        existing.pdf = pdf_file
        existing.save()
        return Response({'msg': 'Re-submitted successfully!', 'submitted_at': existing.submitted_at.isoformat()})
    except AssignmentSubmission.DoesNotExist:
        pass

    sub = AssignmentSubmission.objects.create(
        assignment=assignment,
        student=user,
        pdf=pdf_file,
    )
    return Response({'msg': 'Assignment submitted!', 'submitted_at': sub.submitted_at.isoformat()}, status=201)


# ─── File Download Helpers (PUBLIC) ──────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def download_assignment_pdf(request, assignment_id):
    """
    Serve the teacher's question PDF.
    PUBLIC endpoint — no token required, so plain <a href> downloads work.
    """
    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        raise Http404("Assignment not found")

    if not assignment.pdf or not os.path.isfile(assignment.pdf.path):
        raise Http404("PDF file not found on server")

    return FileResponse(
        open(assignment.pdf.path, 'rb'),
        as_attachment=True,
        filename=os.path.basename(assignment.pdf.name),
        content_type='application/pdf',
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def download_submission_pdf(request, submission_id):
    """
    Serve a student submission PDF.
    PUBLIC endpoint — no token required, so plain <a href> downloads work.
    """
    try:
        sub = AssignmentSubmission.objects.get(id=submission_id)
    except AssignmentSubmission.DoesNotExist:
        raise Http404("Submission not found")

    if not sub.pdf or not os.path.isfile(sub.pdf.path):
        raise Http404("Submission PDF not found on server")

    return FileResponse(
        open(sub.pdf.path, 'rb'),
        as_attachment=True,
        filename=os.path.basename(sub.pdf.name),
        content_type='application/pdf',
    )