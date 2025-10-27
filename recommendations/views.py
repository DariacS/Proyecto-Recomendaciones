# recommendations/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
# Importamos el nuevo servicio
from .services import get_weather, get_movies, get_restaurants, get_google_location_details

class RecommendationView(APIView):
    """
    Un endpoint que consolida datos basado en coordenadas (lat, lon).
    """

    def get(self, request, *args, **kwargs):
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        if not lat or not lon:
            return Response(
                {'error': 'Parámetros "lat" y "lon" son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Llamar al nuevo servicio de geocodificación de Google
        location_details = get_google_location_details(lat, lon)
        precise_address = location_details.get('precise_address')
        country_code = location_details.get('country_code')

        # 2. Llamar a las APIs externas
        weather_data = get_weather(lat, lon)
        movies_data = get_movies(country_code)
        restaurants_data = get_restaurants(lat, lon)

        # 3. Consolidar la respuesta
        consolidated_data = {
            # Enviamos la dirección precisa al frontend
            'precise_address': precise_address, 
            'weather': weather_data,
            'movies_now_playing': movies_data,
            'nearby_restaurants': restaurants_data
        }

        return Response(consolidated_data, status=status.HTTP_200_OK)