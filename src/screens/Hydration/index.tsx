import { SafeAreaView, StyleSheet, Text, Dimensions, View, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import { Back } from '../../components';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks';
import { saveData, getData } from '../../utils/storage';

const { width, height } = Dimensions.get('window');

const buttonSize = width - 80;

interface HydrationData {
  drunkVolume: number;
  plannedVolume: number;
  lastUpdated: string;
}

const HydrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, updateUser } = useAuth();

  const [plannedVolume, setPlannedVolume] = useState(3000);
  const [drunkVolume, setDrunkVolume] = useState(0); // Выпитое количество
  const [dropProgress, setDropProgress] = useState(0);
  
  // Для отображения анимированных чисел
  const [animatedVolumeDisplay, setAnimatedVolumeDisplay] = useState(0);
  const [animatedPercentDisplay, setAnimatedPercentDisplay] = useState(0);
  
  // Анимация для прогресса и count up
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const drunkVolumeAnim = useRef(new Animated.Value(0)).current;
  const progressPercentAnim = useRef(new Animated.Value(0)).current;

  // Загружаем данные при инициализации
  useEffect(() => {
    loadHydrationData();
    
    // Добавляем listener'ы для анимированных значений
    const volumeListener = drunkVolumeAnim.addListener(({ value }) => {
      setAnimatedVolumeDisplay(Math.round(value));
    });

    const percentListener = progressPercentAnim.addListener(({ value }) => {
      setAnimatedPercentDisplay(Math.round(value));
    });

    // Очистка listener'ов
    return () => {
      drunkVolumeAnim.removeListener(volumeListener);
      progressPercentAnim.removeListener(percentListener);
    };
  }, []);

  // Обновляем прогресс при изменении выпитого объёма
  useEffect(() => {
    const newProgress = Math.min((drunkVolume / plannedVolume) * 100, 100);
    setDropProgress(newProgress);
  }, [drunkVolume, plannedVolume]);

  // Анимация count up для объёма и процентов
  const animateCountUp = (newVolume: number) => {
    const newProgress = Math.min((newVolume / plannedVolume) * 100, 100);

    // Параллельная анимация объёма и процентов
    Animated.parallel([
      // Анимация объёма воды
      Animated.timing(drunkVolumeAnim, {
        toValue: newVolume,
        duration: 1000,
        useNativeDriver: false,
      }),
      // Анимация процентов
      Animated.timing(progressPercentAnim, {
        toValue: newProgress,
        duration: 1000,
        useNativeDriver: false,
      }),
      // Анимация прогресса (для других целей если нужно)
      Animated.timing(progressAnim, {
        toValue: newProgress,
        duration: 1000,
        useNativeDriver: false,
      })
    ]).start();
  };

  // Загрузка сохранённых данных
  const loadHydrationData = async () => {
    try {
      const today = new Date().toDateString();
      const savedData = await getData<HydrationData>(`hydration_${today}`);
      
      if (savedData) {
        const volume = savedData.drunkVolume || 0;
        const planned = savedData.plannedVolume || 3000;
        const progress = Math.min((volume / planned) * 100, 100);
        
        setDrunkVolume(volume);
        setPlannedVolume(planned);
        
        // Устанавливаем начальные значения анимации без анимации
        drunkVolumeAnim.setValue(volume);
        progressPercentAnim.setValue(progress);
        progressAnim.setValue(progress);
        
        // Устанавливаем начальные отображаемые значения
        setAnimatedVolumeDisplay(volume);
        setAnimatedPercentDisplay(Math.round(progress));
      } else {
        // Устанавливаем начальные значения для новых данных
        drunkVolumeAnim.setValue(0);
        progressPercentAnim.setValue(0);
        progressAnim.setValue(0);
        
        // Устанавливаем начальные отображаемые значения
        setAnimatedVolumeDisplay(0);
        setAnimatedPercentDisplay(0);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных гидрации:', error);
    }
  };

  // Сохранение данных
  const saveHydrationData = async (newDrunkVolume: number) => {
    try {
      const today = new Date().toDateString();
      const dataToSave = {
        drunkVolume: newDrunkVolume,
        plannedVolume,
        lastUpdated: new Date().toISOString(),
      };
      
      await saveData(`hydration_${today}`, dataToSave);
      
      // Сохраняем также в профиле пользователя
      if (user) {
        await updateUser('dailyWaterIntake', newDrunkVolume);
      }
    } catch (error) {
      console.error('Ошибка сохранения данных гидрации:', error);
    }
  };

  // Добавление воды
  const addWater = (amount: number) => {
    const newVolume = drunkVolume + amount;
    setDrunkVolume(newVolume);
    saveHydrationData(newVolume);

    // Запуск count up анимации
    animateCountUp(newVolume);

    // Анимация масштабирования капли
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();

    // Поздравление при достижении цели
    if (newVolume >= plannedVolume) {
      setTimeout(() => {
        Alert.alert(
          '🎉 Поздравляем!',
          'Вы выполнили дневную норму потребления воды!',
          [{ text: 'Отлично!', style: 'default' }]
        );
      }, 1100); // Увеличил время чтобы анимация завершилась
    }
  };

  // Сброс прогресса (для нового дня)
  const resetProgress = () => {
    Alert.alert(
      'Сброс прогресса',
      'Сбросить прогресс гидрации на сегодня?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Сбросить', 
          style: 'destructive',
          onPress: () => {
            setDrunkVolume(0);
            saveHydrationData(0);
            
            // Анимация сброса к нулю
            animateCountUp(0);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="Гидратация" />
      <View style={styles.container}>
        {/* Главная капля с прогрессом */}
        <Animated.View style={[
          styles.hydrationButton, 
          { 
            width: buttonSize, 
            height: buttonSize,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
            <Image source={require('../../assets/drop.png')} style={{height: buttonSize - 40, resizeMode: 'contain'}} />
            <View style={styles.dropProgressPrecntContainer}>
            <Text style={styles.dropProgressPrecnt}>
              {animatedPercentDisplay} %
            </Text>
            </View>
            <View style={styles.dropProgressTextContainer}>
            <Text style={styles.dropProgressText}>
              {animatedVolumeDisplay} мл
            </Text>
            </View>
        </Animated.View>

        {/* Информация о плане */}
        <Text style={styles.plannedVolume}>{plannedVolume} мл</Text>
        <Text style={styles.plannedVolumeText}>Планируемый объем на день</Text>

        {/* Кнопки добавления воды */}
        <View style={styles.waterButtonsContainer}>
          <TouchableOpacity 
            style={styles.waterButton}
            onPress={() => addWater(250)}
          >
            <Text style={styles.waterButtonText}>+250 мл</Text>
            <Text style={styles.waterButtonSubtext}>Стакан</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.waterButton, styles.primaryWaterButton]}
            onPress={() => addWater(500)}
          >
            <Text style={[styles.waterButtonText, styles.primaryWaterButtonText]}>+500 мл</Text>
            <Text style={[styles.waterButtonSubtext, styles.primaryWaterButtonSubtext]}>Бутылка</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.waterButton}
            onPress={() => addWater(1000)}
          >
            <Text style={styles.waterButtonText}>+1000 мл</Text>
            <Text style={styles.waterButtonSubtext}>Литр</Text>
          </TouchableOpacity>
        </View>

        {/* Кнопка сброса */}
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetProgress}
        >
          <Text style={styles.resetButtonText}>Сбросить прогресс</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    position: 'relative',
    alignItems: 'center',
  },
  hydrationButton: {
    borderRadius: "100%",
    marginTop: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dropProgressPrecntContainer: {
    position: 'absolute',
    top: "60%",
    left: "50%",
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
  },
  dropProgressPrecnt: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  dropProgressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#88D5F6',
    textAlign: 'center',
  },
  dropProgressTextContainer: {
    position: 'absolute',
    top: "75%",
    left: "50%",
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
  },
  plannedVolume: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginTop: 24,
    textAlign: 'center',
  },
  plannedVolumeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#545454',
    textAlign: 'center',
    marginTop: 8,
  },
  waterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    gap: 15,
  },
  waterButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E3E3E3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryWaterButton: {
    backgroundColor: '#DC1818',
    borderColor: '#DC1818',
  },
  waterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  primaryWaterButtonText: {
    color: 'white',
  },
  waterButtonSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  primaryWaterButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
  },
  resetButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    textDecorationLine: 'underline',
  },
});

export default HydrationScreen;