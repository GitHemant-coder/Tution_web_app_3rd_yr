from rest_framework import serializers
from .models import Student, AcademicCalendar, AcademicEvent


# ─── Existing Student Serializer ──────────────────────────────────────────────

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'


# ─── Academic Calendar Serializers ────────────────────────────────────────────

class AcademicEventSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = AcademicEvent
        fields = [
            'id', 'calendar', 'title', 'description', 'date',
            'start_time', 'end_time',
            'category', 'category_display',
            'priority', 'priority_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        # Event date must fall within the calendar's start_date..end_date
        calendar = data.get('calendar') or (self.instance.calendar if self.instance else None)
        event_date = data.get('date') or (self.instance.date if self.instance else None)

        if calendar and event_date:
            if event_date < calendar.start_date or event_date > calendar.end_date:
                raise serializers.ValidationError({
                    'date': (
                        f"Event date must be within the calendar range "
                        f"({calendar.start_date} → {calendar.end_date})."
                    )
                })

        # End time cannot be before start time when both provided
        start = data.get('start_time') or (self.instance.start_time if self.instance else None)
        end = data.get('end_time') or (self.instance.end_time if self.instance else None)
        if start and end and end < start:
            raise serializers.ValidationError({
                'end_time': 'End time cannot be before start time.'
            })

        return data


class AcademicCalendarSerializer(serializers.ModelSerializer):
    events = AcademicEventSerializer(many=True, read_only=True)
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    event_count = serializers.SerializerMethodField()

    class Meta:
        model = AcademicCalendar
        fields = [
            'id', 'academic_year', 'semester', 'semester_display',
            'start_date', 'end_date', 'status',
            'events', 'event_count',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        return obj.created_by.first_name or obj.created_by.username

    def get_event_count(self, obj):
        return obj.events.count()

    def validate(self, data):
        start = data.get('start_date') or (self.instance.start_date if self.instance else None)
        end = data.get('end_date') or (self.instance.end_date if self.instance else None)

        if start and end and end < start:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date.'
            })

        # Prevent duplicate ACTIVE calendars for same academic_year + semester
        year = data.get('academic_year') or (self.instance.academic_year if self.instance else None)
        semester = data.get('semester') or (self.instance.semester if self.instance else None)
        status = data.get('status') or (self.instance.status if self.instance else 'ACTIVE')

        if year and semester and status == 'ACTIVE':
            qs = AcademicCalendar.objects.filter(
                academic_year=year, semester=semester, status='ACTIVE'
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'status': (
                        f"An ACTIVE calendar already exists for "
                        f"{year} — {semester}. Archive or delete it first."
                    )
                })

        return data


class AcademicCalendarListSerializer(serializers.ModelSerializer):
    """Lighter serializer without nested events — for list views."""
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    event_count = serializers.SerializerMethodField()

    class Meta:
        model = AcademicCalendar
        fields = [
            'id', 'academic_year', 'semester', 'semester_display',
            'start_date', 'end_date', 'status', 'event_count',
            'created_at', 'updated_at',
        ]

    def get_event_count(self, obj):
        return obj.events.count()