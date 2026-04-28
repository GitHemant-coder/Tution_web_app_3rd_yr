from django.contrib import admin
from .models import EnrolledSubject, Notification

@admin.register(EnrolledSubject)
class EnrolledSubjectAdmin(admin.ModelAdmin):
    list_display = ('subject_name', 'student', 'progress_percent')
    list_filter = ('student',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'recipient_type', 'created_at')
    list_filter = ('type', 'recipient_type')
