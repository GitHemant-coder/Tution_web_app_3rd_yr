from django.db import models
from django.contrib.auth.models import User

class Student(models.Model):
    attendance = models.FloatField()
    quiz_score = models.FloatField()
    study_hours = models.FloatField()
    performance_score = models.FloatField()
    
    class Meta:
        managed = False  # Since we are using Pandas to read from CSV directly
    
    def __str__(self):
        return f"Student {self.id}"

class EnrolledSubject(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrolled_subjects')
    subject_name = models.CharField(max_length=100)
    progress_percent = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.subject_name} ({self.student.username})"

class Notification(models.Model):
    title = models.CharField(max_length=150, default="New Alert")
    message = models.TextField()
    type = models.CharField(max_length=50, default="Information")
    recipient_type = models.CharField(max_length=50, default="All Users")
    specific_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_notifications', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='created_notifications', null=True, blank=True)
    is_important = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)
    read_by = models.ManyToManyField(User, related_name='read_notifications', blank=True)
    
    def __str__(self):
        return f"{self.title} - {self.recipient_type}"

class StudentPerformance(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performances')
    subject = models.CharField(max_length=150)
    score = models.FloatField()
    max_score = models.FloatField()
    percentage = models.FloatField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if self.max_score and self.max_score > 0:
            self.percentage = round((self.score / self.max_score) * 100, 2)
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.student.username} - {self.subject} ({self.percentage}%)"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    force_password_change = models.BooleanField(default=False)
    
    def __str__(self):
        return self.user.username

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    gender = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    parent_contact_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    admission_date = models.DateField(blank=True, null=True)
    standard = models.CharField(max_length=100, blank=True, null=True)
    division = models.CharField(max_length=50, blank=True, null=True)
    subject = models.CharField(max_length=150, blank=True, null=True)
    roll_number = models.CharField(max_length=50, blank=True, null=True)

class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    gender = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    specialization = models.CharField(max_length=150, blank=True, null=True)
    standard_handled = models.CharField(max_length=150, blank=True, null=True)
    qualification = models.CharField(max_length=150, blank=True, null=True)
    experience = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)

class ParentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True, null=True)
    children = models.ManyToManyField(User, related_name='parents', blank=True)

class TeacherStudentAssignment(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_students')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_teachers')
    subjects = models.TextField(blank=True, null=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('teacher', 'student')
        
    def __str__(self):
        return f"{self.teacher.username} -> {self.student.username}"

class Payment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.CharField(max_length=50) # "April 2026"
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.month}"


# ─── Quiz Feature Models ──────────────────────────────────────────────────────

class Quiz(models.Model):
    """
    A quiz created by a teacher.
    teacher: the User who created it
    title: quiz name, subject: subject area
    time_limit_minutes: how long students get
    """
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_quizzes')
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    time_limit_minutes = models.IntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.subject})"


class Question(models.Model):
    """
    A multiple-choice question belonging to a Quiz.
    options: JSON string, e.g. '["Option A","Option B"]'
    correct_answer: the exact text of the correct option
    marks: points for getting it right
    """
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    options = models.TextField()          # JSON array stored as string
    correct_answer = models.CharField(max_length=300)
    marks = models.IntegerField(default=1)

    def __str__(self):
        return f"Q: {self.text[:50]}"


class QuizAttempt(models.Model):
    """
    One student's attempt at a Quiz.
    answers: JSON string mapping question_id to chosen answer
    score/total_marks: calculated when student submits
    submitted_at: null until student submits
    """
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    answers = models.TextField(blank=True, null=True)  # JSON: {"<q_id>": "<answer>"}
    score = models.FloatField(default=0)
    total_marks = models.FloatField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.username} - {self.quiz.title}"


class IntegrityLog(models.Model):
    """
    Records one suspicious browser event during a quiz attempt.
    event_type: TAB_SWITCH | FULLSCREEN_EXIT | WINDOW_BLUR
    timestamp: ISO 8601 string sent from the browser
    duration_seconds: how long the student was away (0 if not applicable)
    """
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='integrity_logs')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='integrity_logs')
    event_type = models.CharField(max_length=50)
    timestamp = models.CharField(max_length=50)
    duration_seconds = models.FloatField(default=0)

    def __str__(self):
        return f"{self.event_type} - Attempt {self.attempt_id}"

# ─── Assignment Feature Models ────────────────────────────────────────────────

def assignment_pdf_upload_path(instance, filename):
    """Store teacher question PDFs under media/assignments/<assignment_id>/<filename>."""
    return f"assignments/{instance.id or 'new'}/{filename}"


def submission_pdf_upload_path(instance, filename):
    """Store student submission PDFs under media/submissions/<assignment_id>/<student_id>/<filename>."""
    return f"submissions/{instance.assignment_id}/{instance.student_id}/{filename}"


class Assignment(models.Model):
    """An assignment created by a teacher with a PDF question paper and a deadline."""
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assignments_created",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    deadline = models.DateTimeField()
    pdf = models.FileField(upload_to=assignment_pdf_upload_path)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.teacher.username})"


class AssignmentSubmission(models.Model):
    """A student's PDF answer for an assignment. One per (assignment, student)."""
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assignment_submissions",
    )
    pdf = models.FileField(upload_to=submission_pdf_upload_path)
    submitted_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("assignment", "student")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.username} → {self.assignment.title}"
    
    
    # ─── Academic Calendar Feature Models ─────────────────────────────────────────

class AcademicCalendar(models.Model):
    """
    A semester-wise academic calendar managed by an Admin.
    Teachers and Students have read-only access.
    """
    SEMESTER_CHOICES = [
        ('FIRST', 'First Semester'),
        ('SECOND', 'Second Semester'),
        ('THIRD', 'Third Semester'),
        ('FOURTH', 'Fourth Semester'),
        ('FIFTH', 'Fifth Semester'),
        ('SIXTH', 'Sixth Semester'),
        ('SEVENTH', 'Seventh Semester'),
        ('EIGHTH', 'Eighth Semester'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('ARCHIVED', 'Archived'),
    ]

    academic_year = models.CharField(max_length=20)               # e.g. "2026-27"
    semester = models.CharField(max_length=20, choices=SEMESTER_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='academic_calendars_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-academic_year', 'semester']
        # Prevent duplicate ACTIVE calendars for same year+semester
        unique_together = [('academic_year', 'semester', 'status')]

    def __str__(self):
        return f"{self.academic_year} — {self.get_semester_display()}"


class AcademicEvent(models.Model):
    """
    An event belonging to an AcademicCalendar.
    """
    CATEGORY_CHOICES = [
        ('EXAMINATION', 'Examination'),
        ('QUIZ_TEST', 'Quiz / Test'),
        ('ASSIGNMENT', 'Assignment'),
        ('HOLIDAY', 'Holiday'),
        ('PROJECT_MILESTONE', 'Project Milestone'),
        ('SEMINAR_WORKSHOP', 'Seminar / Workshop'),
        ('COLLEGE_EVENT', 'College Event'),
        ('PARENT_TEACHER_MEETING', 'Parent-Teacher Meeting'),
        ('OTHER', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('NORMAL', 'Normal'),
        ('IMPORTANT', 'Important'),
        ('CRITICAL', 'Critical'),
    ]

    calendar = models.ForeignKey(
        AcademicCalendar,
        on_delete=models.CASCADE,
        related_name='events',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='OTHER')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMAL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.title} ({self.date})"