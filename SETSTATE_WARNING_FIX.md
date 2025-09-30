# Исправление предупреждения setState во время рендеринга

## Проблема

```
Warning: Cannot update a component (`OnTheWayView`) while rendering a different component (`MapProvider`). 
To locate the bad setState() call inside `MapProvider`, follow the stack trace...
```

## Причина

Проблема возникала из-за того, что `MapProvider` вызывал `onCourierLocationUpdate` внутри `setState` callback во время рендеринга:

```typescript
// ❌ Проблемный код
setCurrentCourierLocation(prevLocation => {
  const newLocation = { ... };
  
  // Это вызывало setState в родительском компоненте во время рендеринга
  onCourierLocationUpdate?.(newLocation);
  
  return newLocation;
});
```

## Решение

### 1. **MapProvider.tsx**

```typescript
// ✅ Исправленный код
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Создаем стабильную ссылку на callback
const stableOnCourierLocationUpdate = useCallback((location: Location) => {
  onCourierLocationUpdate?.(location);
}, [onCourierLocationUpdate]);

// Симуляция движения курьера
useEffect(() => {
  if (!showCourierRoute) return;

  const moveInterval = setInterval(() => {
    setCurrentCourierLocation(prevLocation => {
      const newLocation = { ... };
      
      // Уведомляем родительский компонент через setTimeout
      // Это откладывает вызов до следующего тика event loop
      setTimeout(() => {
        stableOnCourierLocationUpdate(newLocation);
      }, 0);
      
      return newLocation;
    });
  }, 1000);

  return () => clearInterval(moveInterval);
}, [deliveryLocation, showCourierRoute, stableOnCourierLocationUpdate]);
```

### 2. **OnTheWayView.tsx**

```typescript
// ✅ Исправленный код
import React, { useState, useEffect, useCallback } from 'react';

// Обновление информации о курьере при изменении его местоположения
const handleCourierLocationUpdate = useCallback((newLocation: { latitude: number; longitude: number }) => {
  const distance = calculateDistance(newLocation, deliveryLocation);
  setCourierDistance(`${distance.toFixed(1)} км`);
  
  const timeInMinutes = Math.round((distance / 3) * 60);
  setEstimatedTime(`${timeInMinutes}-${timeInMinutes + 5} мин`);
}, [deliveryLocation]);
```

## Ключевые изменения

1. **useCallback для стабильных ссылок:**
   - `stableOnCourierLocationUpdate` в MapProvider
   - `handleCourierLocationUpdate` в OnTheWayView

2. **setTimeout для отложенного вызова:**
   - `setTimeout(() => { stableOnCourierLocationUpdate(newLocation); }, 0)`
   - Откладывает вызов до следующего тика event loop

3. **Правильные зависимости:**
   - `[deliveryLocation]` для handleCourierLocationUpdate
   - `[onCourierLocationUpdate]` для stableOnCourierLocationUpdate

## Результат

- ✅ Устранено предупреждение React о setState во время рендеринга
- ✅ Стабильная работа компонентов
- ✅ Правильная обработка обновлений состояния
- ✅ Нет потери функциональности

## Почему это работает

1. **useCallback** создает стабильную ссылку на функцию, предотвращая ненужные перерендеры
2. **setTimeout(..., 0)** откладывает выполнение до следующего тика event loop, когда React завершит текущий рендеринг
3. **Правильные зависимости** обеспечивают корректное обновление функций при изменении данных

Это стандартный паттерн для решения проблем с setState во время рендеринга в React.
