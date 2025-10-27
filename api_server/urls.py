# api_server/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Incluir las URLs de la aplicación recommendations
    path('api/v1/', include('recommendations.urls')),
]