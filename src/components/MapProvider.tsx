import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

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
  
  // Маршрут курьера до точки доставки
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([
    ALMATY_LOCATIONS.bostandyk, // Начальная точка
    ALMATY_LOCATIONS.center,    // Центр города
    ALMATY_LOCATIONS.koktem,    // Промежуточная точка
    deliveryLocation || ALMATY_LOCATIONS.center, // Точка доставки с fallback
  ]);

  const mapRef = useRef<MapView>(null);

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

        // Уведомляем родительский компонент о новом местоположении
        onCourierLocationUpdate?.(newLocation);

        return newLocation;
      });
    }, 1000); // Обновляем каждую секунду

    return () => clearInterval(moveInterval);
  }, [deliveryLocation, showCourierRoute, onCourierLocationUpdate]);

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

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        provider={mapProvider}
        initialRegion={{
          latitude: deliveryLocation?.latitude || 43.2220,
          longitude: deliveryLocation?.longitude || 76.8512,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
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

        {/* Маркер курьера */}
        {currentCourierLocation && (
          <Marker
            coordinate={currentCourierLocation}
            title="Курьер"
            description="Ваш курьер едет к вам"
            pinColor="blue"
          />
        )}

        {/* Линия между курьером и местом доставки */}
        {currentCourierLocation && deliveryLocation && (
          <Polyline
            coordinates={[currentCourierLocation, deliveryLocation]}
            strokeColor="#DC1818"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
    </View>
  );

  // return (
  //   <View style={styles.container}>
  //     <MapView 
  //       ref={mapRef}
  //       style={styles.map}
  //       provider={PROVIDER_GOOGLE}
  //       initialRegion={{
  //         latitude: deliveryLocation?.latitude || 43.2220,
  //         longitude: deliveryLocation?.longitude || 76.8512,
  //         latitudeDelta: 0.05,
  //         longitudeDelta: 0.05,
  //       }}
  //       showsUserLocation={true}
  //       showsMyLocationButton={true}
  //     >
  //       {/* Маркер курьера */}
  //       {currentCourierLocation && (
  //         <Marker
  //           coordinate={currentCourierLocation}
  //           title="Курьер"
  //           description="Ваш курьер едет к вам"
  //         >
  //           <View style={styles.courierMarker}>
  //             <Text style={styles.courierText}>🚗</Text>
  //           </View>
  //         </Marker>
  //       )}

  //       {/* Маркер места доставки */}
  //       {deliveryLocation && (
  //         <Marker
  //           coordinate={deliveryLocation}
  //           title="Место доставки"
  //           description="Ваш адрес доставки"
  //         >
  //           <View style={styles.deliveryMarker}>
  //             <Text style={styles.deliveryText}>🏠</Text>
  //           </View>
  //         </Marker>
  //       )}

  //       {/* Маршрут курьера */}
  //       {showCourierRoute && routeCoordinates.length > 1 && (
  //         <Polyline
  //           coordinates={routeCoordinates}
  //           strokeColor="#007AFF"
  //           strokeWidth={3}
  //           lineDashPattern={[10, 5]}
  //         />
  //       )}

  //       {/* Прямая линия от курьера к месту доставки */}
  //       {currentCourierLocation && deliveryLocation && (
  //         <Polyline
  //           coordinates={[currentCourierLocation, deliveryLocation]}
  //           strokeColor="#DC1818"
  //           strokeWidth={2}
  //         />
  //       )}
  //     </MapView>

  //     {/* Кнопки управления */}
  //     <View style={styles.controls}>
  //       <TouchableOpacity style={styles.controlButton} onPress={centerMapOnDelivery}>
  //         <Text style={styles.controlButtonText}>К адресу</Text>
  //       </TouchableOpacity>
  //       <TouchableOpacity style={styles.controlButton} onPress={showFullRoute}>
  //         <Text style={styles.controlButtonText}>Весь маршрут</Text>
  //       </TouchableOpacity>
  //     </View>

  //     {/* Информация о курьере */}
  //     <View style={styles.courierInfo}>
  //       <Text style={styles.courierInfoTitle}>Курьер в пути</Text>
  //       <Text style={styles.courierInfoText}>
  //         {deliveryLocation && currentCourierLocation ? 
  //           `Расстояние до адреса: ~${Math.round(
  //             Math.sqrt(
  //               Math.pow(deliveryLocation.latitude - currentCourierLocation.latitude, 2) +
  //               Math.pow(deliveryLocation.longitude - currentCourierLocation.longitude, 2)
  //             ) * 111000
  //           )} м` 
  //           : 'Загружается информация о местоположении...'
  //         }
  //       </Text>
  //     </View>
  //   </View>
  // );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  courierMarker: {
    backgroundColor: '#007AFF',
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
