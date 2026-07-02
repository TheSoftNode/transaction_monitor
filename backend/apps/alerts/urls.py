from rest_framework.routers import DefaultRouter
from .views import AlertViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'alerts', AlertViewSet, basename='alert')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = router.urls
