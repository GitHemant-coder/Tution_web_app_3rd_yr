"""
quiz_views.py — Quiz + Integrity Monitoring endpoints.

Teacher endpoints:
  GET/POST  /api/quizzes/                    — list/create quizzes
  DELETE    /api/quizzes/<quiz_id>/delete/   — delete a quiz
  GET       /api/quizzes/<quiz_id>/results/  — see results + integrity report

Student endpoints:
  GET   /api/quizzes/available/              — list all quizzes
  POST  /api/quizzes/<quiz_id>/start/        — start attempt, get questions
  POST  /api/attempts/<attempt_id>/submit/   — submit answers

Integrity endpoints:
  POST  /api/attempts/<attempt_id>/integrity-events/  — log one event
  GET   /api/attempts/<attempt_id>/integrity/          — get summary
"""

import json
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Quiz, Question, QuizAttempt, IntegrityLog
from .admin_views import get_user_from_request, get_role


def _auth(request):
    """Extract authenticated user. Returns (user, None) on success or (None, error_response) on failure."""
    user = get_user_from_request(request)
    if not user:
        return None, Response({'msg': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    return user, None


# ─── Teacher: Create & List Quizzes ──────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def quiz_list_create(request):
    """
    GET  — Teacher sees their own quizzes.
    POST — Teacher creates a quiz with questions.
    """
    user, err = _auth(request)
    if err:
        return err

    role = get_role(user)

    if request.method == 'GET':
        # Teachers only see their own quizzes here
        if role == 'teacher':
            quizzes = Quiz.objects.filter(teacher=user).order_by('-created_at')
        else:
            quizzes = Quiz.objects.all().order_by('-created_at')

        data = []
        for q in quizzes:
            data.append({
                'id': q.id,
                'title': q.title,
                'subject': q.subject,
                'description': q.description or '',
                'time_limit_minutes': q.time_limit_minutes,
                'question_count': q.questions.count(),
                'created_at': q.created_at.isoformat(),
                'teacher_name': q.teacher.first_name or q.teacher.username,
            })
        return Response(data)

    elif request.method == 'POST':
        # Only teachers can create
        if role != 'teacher':
            return Response({'msg': 'Only teachers can create quizzes'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        title = data.get('title', '').strip()
        subject = data.get('subject', '').strip()
        description = data.get('description', '')
        time_limit = int(data.get('time_limit_minutes', 30))
        questions_data = data.get('questions', [])

        if not title or not subject:
            return Response({'msg': 'Title and subject are required'}, status=status.HTTP_400_BAD_REQUEST)
        if not questions_data:
            return Response({'msg': 'At least one question is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Create quiz
        quiz = Quiz.objects.create(
            teacher=user,
            title=title,
            subject=subject,
            description=description,
            time_limit_minutes=time_limit
        )

        # Create questions
        for q in questions_data:
            q_text = q.get('text', '').strip()
            options = q.get('options', [])
            correct = q.get('correct_answer', '').strip()
            marks = int(q.get('marks', 1))
            if not q_text or not options or not correct:
                continue  # skip invalid questions
            Question.objects.create(
                quiz=quiz,
                text=q_text,
                options=json.dumps(options),  # store list as JSON string
                correct_answer=correct,
                marks=marks
            )

        return Response({'msg': 'Quiz created successfully!', 'quiz_id': quiz.id}, status=status.HTTP_201_CREATED)


# ─── Teacher: Delete Quiz ─────────────────────────────────────────────────────

@api_view(['DELETE'])
@permission_classes([AllowAny])
def quiz_delete(request, quiz_id):
    """Teacher deletes one of their own quizzes."""
    user, err = _auth(request)
    if err:
        return err
    try:
        quiz = Quiz.objects.get(id=quiz_id, teacher=user)
        quiz.delete()
        return Response({'msg': 'Quiz deleted'})
    except Quiz.DoesNotExist:
        return Response({'msg': 'Quiz not found or not yours'}, status=404)


# ─── Teacher: Quiz Results + Integrity Report ─────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def quiz_results(request, quiz_id):
    """
    Teacher sees all attempt results for a quiz, including integrity summary.
    """
    user, err = _auth(request)
    if err:
        return err

    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        return Response({'msg': 'Quiz not found'}, status=404)

    attempts = QuizAttempt.objects.filter(quiz=quiz).select_related('student').prefetch_related('integrity_logs')

    results = []
    for attempt in attempts:
        logs = attempt.integrity_logs.all()

        # Count each type of event
        tab_switches = logs.filter(event_type='TAB_SWITCH').count()
        fullscreen_exits = logs.filter(event_type='FULLSCREEN_EXIT').count()
        window_blurs = logs.filter(event_type='WINDOW_BLUR').count()
        total_time_away = sum(float(log.duration_seconds) for log in logs)

        # Rule: any event → REVIEW_RECOMMENDED, no events → NORMAL
        integrity_status = 'NORMAL' if logs.count() == 0 else 'REVIEW_RECOMMENDED'

        events = [{
            'event_type': log.event_type,
            'timestamp': log.timestamp,
            'duration_seconds': log.duration_seconds
        } for log in logs]

        results.append({
            'attempt_id': attempt.id,
            'student_id': attempt.student.id,
            'student_name': attempt.student.first_name or attempt.student.username,
            'score': attempt.score,
            'total_marks': attempt.total_marks,
            'started_at': attempt.started_at.isoformat(),
            'submitted_at': attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            'integrity': {
                'tab_switches': tab_switches,
                'fullscreen_exits': fullscreen_exits,
                'window_blurs': window_blurs,
                'total_time_away': round(total_time_away, 1),
                'status': integrity_status,
                'events': events
            }
        })

    return Response({'quiz_id': quiz_id, 'quiz_title': quiz.title, 'results': results})


# ─── Student: Available Quizzes ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def available_quizzes(request):
    """Students see all quizzes with attempt status."""
    user, err = _auth(request)
    if err:
        return err

    quizzes = Quiz.objects.all().order_by('-created_at')
    data = []
    for q in quizzes:
        attempt = QuizAttempt.objects.filter(quiz=q, student=user, submitted_at__isnull=False).first()
        data.append({
            'id': q.id,
            'title': q.title,
            'subject': q.subject,
            'description': q.description or '',
            'time_limit_minutes': q.time_limit_minutes,
            'question_count': q.questions.count(),
            'teacher_name': q.teacher.first_name or q.teacher.username,
            'already_attempted': attempt is not None,
            'my_score': attempt.score if attempt else None,
            'my_total': attempt.total_marks if attempt else None,
        })
    return Response(data)


# ─── Student: Start Quiz ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def start_quiz(request, quiz_id):
    """
    Creates a QuizAttempt and returns questions WITHOUT correct answers.
    If student already has an incomplete attempt, reuses it.
    """
    user, err = _auth(request)
    if err:
        return err

    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        return Response({'msg': 'Quiz not found'}, status=404)

    # Reuse incomplete attempt if exists
    existing = QuizAttempt.objects.filter(quiz=quiz, student=user, submitted_at__isnull=True).first()
    if existing:
        attempt = existing
    else:
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=user,
            total_marks=sum(q.marks for q in quiz.questions.all())
        )

    # Return questions WITHOUT correct_answer to prevent cheating
    questions = []
    for q in quiz.questions.all():
        questions.append({
            'id': q.id,
            'text': q.text,
            'options': json.loads(q.options),
            'marks': q.marks
        })

    return Response({
        'attempt_id': attempt.id,
        'quiz_id': quiz.id,
        'quiz_title': quiz.title,
        'subject': quiz.subject,
        'time_limit_minutes': quiz.time_limit_minutes,
        'total_marks': attempt.total_marks,
        'questions': questions
    })


# ─── Student: Submit Quiz ─────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_quiz(request, attempt_id):
    """
    Student submits answers. Calculates score automatically.
    Body: { "answers": { "<question_id>": "<chosen_answer>" } }
    """
    user, err = _auth(request)
    if err:
        return err

    try:
        attempt = QuizAttempt.objects.get(id=attempt_id, student=user)
    except QuizAttempt.DoesNotExist:
        return Response({'msg': 'Attempt not found'}, status=404)

    if attempt.submitted_at:
        return Response({'msg': 'Quiz already submitted'}, status=400)

    answers = request.data.get('answers', {})

    # Score: compare each submitted answer to correct_answer
    score = 0
    for question in attempt.quiz.questions.all():
        student_answer = answers.get(str(question.id), '').strip()
        if student_answer == question.correct_answer.strip():
            score += question.marks

    attempt.answers = json.dumps(answers)
    attempt.score = score
    attempt.submitted_at = timezone.now()
    attempt.save()

    return Response({
        'msg': 'Quiz submitted successfully!',
        'score': score,
        'total_marks': attempt.total_marks,
        'percentage': round((score / attempt.total_marks) * 100, 2) if attempt.total_marks > 0 else 0
    })


# ─── Integrity: Log One Event ─────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def log_integrity_event(request, attempt_id):
    """
    Frontend calls this every time a suspicious event is detected.
    Body: {
      "event_type": "TAB_SWITCH" | "FULLSCREEN_EXIT" | "WINDOW_BLUR",
      "timestamp": "2025-01-01T12:00:00.000Z",
      "duration_seconds": 5.3
    }
    """
    user, err = _auth(request)
    if err:
        return err

    try:
        attempt = QuizAttempt.objects.get(id=attempt_id, student=user)
    except QuizAttempt.DoesNotExist:
        return Response({'msg': 'Attempt not found'}, status=404)

    event_type = request.data.get('event_type', '')
    timestamp = request.data.get('timestamp', '')
    duration = float(request.data.get('duration_seconds', 0))

    valid_types = ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'WINDOW_BLUR']
    if event_type not in valid_types:
        return Response({'msg': f'Invalid event_type. Allowed: {valid_types}'}, status=400)

    IntegrityLog.objects.create(
        attempt=attempt,
        student=user,
        event_type=event_type,
        timestamp=timestamp,
        duration_seconds=duration
    )

    return Response({'msg': 'Integrity event recorded'}, status=201)


# ─── Integrity: Summary for One Attempt ──────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def integrity_summary(request, attempt_id):
    """
    Returns a summary of all integrity events for a given attempt.
    """
    user, err = _auth(request)
    if err:
        return err

    try:
        attempt = QuizAttempt.objects.get(id=attempt_id)
    except QuizAttempt.DoesNotExist:
        return Response({'msg': 'Attempt not found'}, status=404)

    logs = attempt.integrity_logs.all()
    tab_switches = logs.filter(event_type='TAB_SWITCH').count()
    fullscreen_exits = logs.filter(event_type='FULLSCREEN_EXIT').count()
    window_blurs = logs.filter(event_type='WINDOW_BLUR').count()
    total_time_away = sum(float(log.duration_seconds) for log in logs)
    integrity_status = 'NORMAL' if logs.count() == 0 else 'REVIEW_RECOMMENDED'

    return Response({
        'attempt_id': attempt_id,
        'tab_switches': tab_switches,
        'fullscreen_exits': fullscreen_exits,
        'window_blurs': window_blurs,
        'total_time_away': round(total_time_away, 1),
        'status': integrity_status
    })
