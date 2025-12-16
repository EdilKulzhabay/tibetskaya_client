import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface Location {
  latitude: number;
  longitude: number;
}

interface MapProviderProps {
  courierLocation?: Location;
  deliveryLocation: Location;
  showCourierRoute?: boolean;
  onCourierLocationUpdate?: (location: Location) => void;
}

// Координаты различных районов Алматы
const ALMATY_LOCATIONS = {
  center: { latitude: 43.2220, longitude: 76.8512 },
  samal1: { latitude: 43.2267, longitude: 76.8782 },
  samal2: { latitude: 43.2156, longitude: 76.8934 },
  bostandyk: { latitude: 43.2065, longitude: 76.8734 },
  medeu: { latitude: 43.1969, longitude: 76.8643 },
  koktem: { latitude: 43.2401, longitude: 76.8234 },
  almaly: { latitude: 43.2511, longitude: 76.8445 },
};

const MapProvider: React.FC<MapProviderProps> = ({
  courierLocation,
  deliveryLocation,
  showCourierRoute = true,
  onCourierLocationUpdate,
}) => {
  const [currentCourierLocation, setCurrentCourierLocation] = useState<Location>(
    courierLocation || ALMATY_LOCATIONS.bostandyk
  );
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // Маршрут курьера до точки доставки
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([
    ALMATY_LOCATIONS.bostandyk, // Начальная точка
    ALMATY_LOCATIONS.center,    // Центр города
    ALMATY_LOCATIONS.koktem,    // Промежуточная точка
    deliveryLocation || ALMATY_LOCATIONS.center, // Точка доставки с fallback
  ]);

  const mapRef = useRef<MapView>(null);

  // Создаем стабильную ссылку на callback
  const stableOnCourierLocationUpdate = useCallback((location: Location) => {
    onCourierLocationUpdate?.(location);
  }, [onCourierLocationUpdate]);

  // Симуляция движения курьера
  useEffect(() => {
    if (!showCourierRoute) return;

    const moveInterval = setInterval(() => {
      setCurrentCourierLocation(prevLocation => {
        // Простая анимация движения к цели
        const targetLocation = deliveryLocation || ALMATY_LOCATIONS.center;
        const latDiff = targetLocation.latitude - prevLocation.latitude;
        const lngDiff = targetLocation.longitude - prevLocation.longitude;
        
        // Медленное движение к цели
        const speed = 0.0001; // Скорость движения
        
        const newLocation = {
          latitude: prevLocation.latitude + (latDiff * speed),
          longitude: prevLocation.longitude + (lngDiff * speed),
        };

        // Уведомляем родительский компонент о новом местоположении через setTimeout
        setTimeout(() => {
          stableOnCourierLocationUpdate(newLocation);
        }, 0);

        return newLocation;
      });
    }, 1000); // Обновляем каждую секунду

    return () => clearInterval(moveInterval);
  }, [deliveryLocation, showCourierRoute, stableOnCourierLocationUpdate]);

  // Центрирование карты на области доставки
  const centerMapOnDelivery = () => {
    if (mapRef.current && deliveryLocation) {
      mapRef.current.animateToRegion({
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  // Показать весь маршрут
  const showFullRoute = () => {
    if (mapRef.current) {
      // Находим границы всех точек маршрута
      const coordinates = [...routeCoordinates, currentCourierLocation];
      const latitudes = coordinates.map(coord => coord.latitude);
      const longitudes = coordinates.map(coord => coord.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const latDelta = (maxLat - minLat) * 1.2; // Добавляем отступы
      const lngDelta = (maxLng - minLng) * 1.2;

      mapRef.current.animateToRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(latDelta, 0.05),
        longitudeDelta: Math.max(lngDelta, 0.05),
      }, 1000);
    }
  };

  // Определяем провайдер карт в зависимости от платформы
  // iOS: используем Apple Maps (undefined = Apple Maps по умолчанию)
  // Android: используем Google Maps
  const mapProvider = Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE;

  // Если карта не готова или есть ошибка, показываем fallback
  if (mapError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Карта временно недоступна</Text>
          <Text style={styles.errorSubtext}>Проверьте подключение к интернету</Text>
        </View>
      </View>
    );
  }

  useEffect(() => {
    // Задержка перед показом карты для стабильности на Android
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!mapReady) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white'}}>
        <ActivityIndicator size="large" color="#DC1818" />
        <Text style={{fontSize: 16, color: '#545454'}}>Загрузка карты...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        style={styles.map} 
        provider={mapProvider}
        initialRegion={{
          latitude: deliveryLocation?.latitude || 43.2220,
          longitude: deliveryLocation?.longitude || 76.8512,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={Platform.OS === 'ios'}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        // onMapReady={handleMapReady}
        // // onError={handleMapError}
        // loadingEnabled={true}
        // loadingIndicatorColor="#DC1818"
        // loadingBackgroundColor="#f6f6f6"
      >
        {/* Маркер места доставки */}
        {deliveryLocation && (
          <Marker
            coordinate={deliveryLocation}
            title="Место доставки"
            description="Ваш адрес доставки"
            pinColor="red"
          />
        )}

        {/* Линия между курьером и местом доставки */}
        {currentCourierLocation && deliveryLocation && (
          <Polyline
            coordinates={[currentCourierLocation, deliveryLocation]}
            strokeColor="#000000"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Маркер курьера */}
        {currentCourierLocation && (
          Platform.OS === 'ios' ? (
            <Marker
              coordinate={currentCourierLocation}
              title="Курьер"
              description="Ваш курьер едет к вам"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <Image source={require('../assets/courierCar.png')} style={{width: 40, height: 40}} />
            </Marker>
          ) : (
            <Marker
              coordinate={currentCourierLocation}
              title="Курьер"
              description="Ваш курьер едет к вам"
              image={require('../assets/courierCar.png')}
              anchor={{ x: 0.5, y: 0.5 }}
            />
          )
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC1818',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#545454',
    textAlign: 'center',
  },
  courierMarker: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  courierImage: {
    width: 28,
    height: 28,
  },
  courierText: {
    fontSize: 18,
  },
  deliveryMarker: {
    backgroundColor: '#DC1818',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  deliveryText: {
    fontSize: 18,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  controlButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  courierInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
  },
  courierInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101010',
    marginBottom: 5,
  },
  courierInfoText: {
    fontSize: 14,
    color: '#545454',
  },
});

export default MapProvider;