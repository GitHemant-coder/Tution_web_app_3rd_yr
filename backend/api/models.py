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
