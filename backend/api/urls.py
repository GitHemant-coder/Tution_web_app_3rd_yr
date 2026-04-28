from django.urls import path
from . import views, auth_views, admin_views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def welcome(request):
    return Response({"message": "TutorConnect API is alive!"})

urlpatterns = [
    path('', welcome, name='welcome'),
    path('students/', views.student_list, name='student-list'),
    path('student/<int:student_id>/', views.student_detail, name='student-detail'),
    path('performance-summary/', views.performance_summary, name='performance-summary'),
    path('subject-analysis/', views.subject_analysis, name='subject-analysis'),
    path('at-risk-students/', views.at_risk_students, name='at-risk-students'),
    path('student-ranking/', views.student_ranking, name='student-ranking'),
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    
    # Auth Endpoints
    path('auth/register/', auth_views.register, name='register-slash'),
    path('auth/register', auth_views.register, name='register'),
    path('auth/login/', auth_views.login, name='login-slash'),
    path('auth/login', auth_views.login, name='login'),
    path('auth/change-password/', auth_views.change_password, name='change-password-slash'),
    path('auth/change-password', auth_views.change_password, name='change-password'),
    path('auth/profile/me/', auth_views.profile_me, name='profile-me-slash'),
    path('auth/profile/me', auth_views.profile_me, name='profile-me'),
    
    # Prediction Endpoint
    path('predict-performance/', views.predict_performance, name='predict-performance-slash'),
    path('predict-performance', views.predict_performance, name='predict-performance'),
    path('predict-student-performance/<int:student_id>/', views.predict_student_performance, name='predict-student-performance'),
    
    # Material Recommendation Endpoints
    path('materials/', views.all_materials, name='all-materials'),
    path('recommendations/<int:student_id>/', views.recommend_materials, name='recommend-materials'),
    path('track-interaction/', views.track_interaction, name='track-interaction'),
    
    # Classify doubt Endpoint
    path('classify-doubt/', views.classify_doubt, name='classify-doubt'),
    
    # Teacher Material Upload
    path('upload-material/', views.upload_material, name='upload-material'),
    path('teacher-dashboard-sync/', views.teacher_dashboard_sync, name='teacher-dashboard-sync'),
    
    # Emotion-Aware Chatbot
    path('chatbot/', views.emotion_chatbot, name='emotion-chatbot'),
    
    # Study Plan Generator (Old)
    path('study-plan/<int:student_id>/', views.generate_study_plan, name='generate-study-plan'),
    
    # Study Calendar Generator (New Interactive)
    path('study-calendar/', views.generate_study_calendar, name='generate-study-calendar'),
    
    # Explainable Performance AI
    path('explain-performance/<int:student_id>/', views.explain_performance, name='explain-performance'),
    path('explain-performance-dynamic/', views.explain_performance_dynamic, name='explain-performance-dynamic'),
    
    # Dynamic Subjects and Notifications
    path('dashboard-dynamic-data/<int:student_id>/', views.get_dashboard_dynamic_data, name='dashboard-dynamic-data'),

    # Voice Doubt Assistant
    path('voice-doubt-assistant/', views.voice_doubt_assistant, name='voice-doubt-assistant'),

    # Weak Topic Detector
    path('weak-topics/', views.detect_weak_topics, name='weak-topics'),

    # Parent Alerts
    path('parent-alerts/<int:student_id>/', views.parent_alerts, name='parent-alerts'),

    # Admin Dashboard Tools
    path('admin/users/', admin_views.manage_users, name='admin-users-slash'),
    path('admin/users', admin_views.manage_users, name='admin-users'),
    path('admin/users/<int:user_id>/', admin_views.manage_user_detail, name='admin-user-detail-slash'),
    path('admin/users/<int:user_id>', admin_views.manage_user_detail, name='admin-user-detail'),
    path('admin/link-child/', admin_views.link_child, name='admin-link-child-slash'),
    path('admin/link-child', admin_views.link_child, name='admin-link-child'),
    path('admin/stats/', admin_views.get_admin_stats, name='admin-stats-slash'),
    path('admin/stats', admin_views.get_admin_stats, name='admin-stats'),
    path('admin/performance/', admin_views.manage_performance, name='admin-perf-slash'),
    path('admin/performance', admin_views.manage_performance, name='admin-perf'),
    path('admin/performance/<int:record_id>/', admin_views.manage_performance_detail, name='admin-perf-detail-slash'),
    path('admin/performance/<int:record_id>', admin_views.manage_performance_detail, name='admin-perf-detail'),
    path('admin/students/', admin_views.admin_students, name='admin-students-slash'),
    path('admin/students', admin_views.admin_students, name='admin-students'),

    # Student Dashboard 
    path('student/performance/<int:student_id>/', views.student_performance_records, name='student-perf'),
    
    # Notifications Routing
    path('admin/notifications/', admin_views.manage_notifications, name='admin-notifications-slash'),
    path('admin/notifications', admin_views.manage_notifications, name='admin-notifications'),
    path('notifications/my/', views.get_my_notifications, name='my-notifications-slash'),
    path('notifications/my', views.get_my_notifications, name='my-notifications'),
    path('notifications/<int:notif_id>/read/', views.mark_notification_read, name='mark-notif-read-slash'),
    path('notifications/<int:notif_id>/read', views.mark_notification_read, name='mark-notif-read'),
    path('notifications/unread-count/', views.get_unread_count, name='notif-unread-count-slash'),
    path('notifications/unread-count', views.get_unread_count, name='notif-unread-count'),
    
    # Assignments Routing
    path('admin/assignments/', admin_views.manage_assignments, name='admin-assignments-slash'),
    path('admin/assignments', admin_views.manage_assignments, name='admin-assignments'),
    path('admin/assignments/<int:assign_id>/', admin_views.delete_assignment, name='admin-assignments-del-slash'),
    path('admin/assignments/<int:assign_id>', admin_views.delete_assignment, name='admin-assignments-del'),
    
    # Payments Routing
    path('admin/payments/', admin_views.manage_payments, name='admin-payments-slash'),
    path('admin/payments', admin_views.manage_payments, name='admin-payments'),
    path('admin/payments/<int:payment_id>/', admin_views.update_payment, name='admin-payments-detail-slash'),
    path('admin/payments/<int:payment_id>', admin_views.update_payment, name='admin-payments-detail'),
]
