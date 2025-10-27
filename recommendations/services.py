# recommendations/services.py
import requests
from django.conf import settings

# Constantes de API
OWM_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
TMDB_MOVIES_URL = "https://api.themoviedb.org/3/movie/now_playing"
TMDB_IMG_BASE_URL = "https://image.tmdb.org/t/p/w500"
# --- NUEVAS CONSTANTES DE GOOGLE ---
GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
GOOGLE_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
GOOGLE_PHOTO_URL_BASE = "https://maps.googleapis.com/maps/api/place/photo"


def get_google_location_details(lat, lon):
    """
    NUEVA FUNCIÓN: Usa Google Geocoding para obtener una dirección precisa,
    la ciudad y el código de país, todo en una llamada.
    """
    city_name = "Ubicación"
    country_code = "CL" # Default Chile
    precise_address = "Ubicación desconocida"
    
    try:
        params = {
            'latlng': f'{lat},{lon}',
            'key': settings.GOOGLE_MAPS_KEY,
            'language': 'es'
        }
        response = requests.get(GOOGLE_GEOCODE_URL, params=params)
        response.raise_for_status()
        data = response.json()

        if data.get('results'):
            first_result = data['results'][0]
            # 1. Obtener la dirección precisa
            precise_address = first_result.get('formatted_address', precise_address)

            # 2. Analizar los componentes para ciudad y país
            for component in first_result.get('address_components', []):
                types = component.get('types', [])
                if 'locality' in types:
                    city_name = component.get('long_name', city_name)
                if 'country' in types:
                    country_code = component.get('short_name', country_code)
        
    except requests.RequestException as e:
        print(f"Error en Google Geocoding API: {e}")
        
    return {
        'city_name': city_name, # Aún útil para depuración
        'country_code': country_code,
        'precise_address': precise_address
    }


def get_weather(lat, lon):
    # (Esta función no cambia)
    try:
        params = {
            'lat': lat, 'lon': lon, 'appid': settings.OPENWEATHER_KEY,
            'units': 'metric', 'lang': 'es'
        }
        response = requests.get(OWM_WEATHER_URL, params=params)
        response.raise_for_status()
        data = response.json()
        weather_data = data.get('weather', [{}])[0]
        main_data = data.get('main', {})
        return {
            'description': weather_data.get('description'),
            'temp': main_data.get('temp'),
            'feels_like': main_data.get('feels_like'),
            'icon_url': f"http://openweathermap.org/img/wn/{weather_data.get('icon')}@2x.png"
        }
    except requests.RequestException as e:
        return {'error': f'Error en API de Clima: {str(e)}'}


def get_movies(country_code):
    # (Esta función no cambia)
    try:
        params = {
            'api_key': settings.TMDB_KEY,
            'language': 'es-ES',
            'region': country_code
        }
        response = requests.get(TMDB_MOVIES_URL, params=params)
        response.raise_for_status()
        data = response.json()
        movies = []
        for movie in data.get('results', [])[:15]:
            poster_path = movie.get('poster_path')
            movies.append({
                'title': movie.get('title'),
                'overview': movie.get('overview'),
                'release_date': movie.get('release_date'),
                'poster_url': f"{TMDB_IMG_BASE_URL}{poster_path}" if poster_path else None
            })
        return movies
    except requests.RequestException as e:
        return {'error': f'Error en API de Películas: {str(e)}'}


def get_restaurants(lat, lon):
    # (Esta función no cambia)
    try:
        params = {
            'location': f'{lat},{lon}', 'radius': 5000,
            'type': 'restaurant', 'key': settings.GOOGLE_MAPS_KEY,
        }
        # Usamos la constante actualizada
        response = requests.get(GOOGLE_NEARBY_URL, params=params) 
        response.raise_for_status()
        data = response.json()
        restaurants = []
        for place in data.get('results', [])[:15]:
            photo_url = None
            if place.get('photos'):
                photo_ref = place['photos'][0].get('photo_reference')
                if photo_ref:
                    photo_url = f"{GOOGLE_PHOTO_URL_BASE}?maxwidth=400&photoreference={photo_ref}&key={settings.GOOGLE_MAPS_KEY}"
            restaurants.append({
                'name': place.get('name'),
                'address': place.get('vicinity'),
                'rating': place.get('rating'),
                'photo_url': photo_url
            })
        return restaurants
    except requests.RequestException as e:
        return {'error': f'Error en API de Google Places: {str(e)}'}