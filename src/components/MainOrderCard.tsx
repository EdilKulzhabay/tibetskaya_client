import React, {useEffect, useMemo, useState} from 'react';
import {
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapProvider from './MapProvider';
import {OrderAddress, OrderData, OrderProduct} from '../types/navigation';

/** Объём бутыли, доступный в форме создания заказа на главном экране. */
export type OrderVolume = 'b19' | 'b12';

export interface CreateOrderPayload {
  quantity19: number;
  quantity12: number;
  /** Ответ на «Есть пустые бутыли?» отдельно для каждого объёма. */
  hasEmptyBottles: Record<OrderVolume, boolean>;
  emptyBottlesCount: Record<OrderVolume, number>;
  total: number;
}

interface MainOrderCardProps {
  /** Домашний/выбранный адрес — показывается только в состоянии создания заказа. */
  address: OrderAddress | null;
  /** Активные заказы клиента (принят/в пути), а также заказы, доставленные сегодня. */
  orders: OrderData[];
  /** Последний заказ клиента — для повтора и определения «доставлен сегодня». */
  lastOrder: OrderData | null;
  price19: number;
  price12: number;
  onChangeAddress?: () => void;
  onChatWithCourier: (order: OrderData) => void;
  onRepeatOrder: (order: OrderData) => void;
  onCreateOrder: (payload: CreateOrderPayload) => void;
  /** Отмена заказа со статусом «Заказ принят». */
  onCancelOrder: (order: OrderData) => void;
}

const RED = '#DC1818';
const MIN_QUANTITY_B19 = 2;
const NEW_TARE_PRICE_B19 = 3500;
const NEW_TARE_PRICE_B12 = 2500;

/** Отступ по горизонтали у контента экрана (см. `content` в HomeScreen) — карточка
 * активного заказа в карусели должна занимать столько же ширины, сколько занимала
 * одна карточка в обычном вертикальном списке. */
const CONTENT_HORIZONTAL_PADDING = 16;
const ACTIVE_ORDER_CARD_WIDTH =
  Dimensions.get('window').width - CONTENT_HORIZONTAL_PADDING * 2;
const ACTIVE_ORDER_CARD_GAP = 12;

const VOLUME_LABEL: Record<OrderVolume, string> = {
  b19: '18,9 л',
  b12: '12,5 л',
};

const VOLUME_IMAGE: Record<OrderVolume, ReturnType<typeof require>> = {
  b19: require('../assets/bottleProduct.png'),
  b12: require('../assets/bottleProduct12.png'),
};

function isSameDay(isoDate: string | undefined, reference: Date): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function formatTime(isoDate: string | undefined): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
}

function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTimeNumeric(isoDate: string | undefined): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const datePart = date.toLocaleDateString('ru-RU');
  const timePart = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} в ${timePart}`;
}

/** Пояснение к причинам отмены, которые клиент сам выбирает в OrderStatusScreen —
 * для остальных значений (в т.ч. свободный текст «Другое») показываем только сам `reason`. */
const CANCEL_REASON_DETAILS: Record<string, string> = {
  'Не буду дома': 'Клиента не будет на месте в момент доставки',
  'Неправильно указал дату': 'Нужно оформить заказ на другую дату',
  Передумал: 'Клиент отказался от заказа',
};

function getCancelReasonDisplay(reason: string | undefined): {
  title: string;
  subtitle?: string;
} {
  const trimmed = reason?.trim();
  if (!trimmed) return {title: 'Причина не указана'};
  const knownSubtitle = CANCEL_REASON_DETAILS[trimmed];
  if (knownSubtitle) return {title: trimmed, subtitle: knownSubtitle};

  const separators = [': ', ' — ', ' - '];
  for (const separator of separators) {
    const index = trimmed.indexOf(separator);
    if (index > -1) {
      return {
        title: trimmed.slice(0, index).trim(),
        subtitle: trimmed.slice(index + separator.length).trim(),
      };
    }
  }
  return {title: trimmed};
}

function buildProductLines(products: OrderProduct): string[] {
  const lines: string[] = [];
  if (products.b19 > 0) lines.push(`${products.b19} × Вода 18,9 л`);
  if (products.b12 > 0) lines.push(`${products.b12} × Вода 12,5 л`);
  return lines;
}

function getOrderNumber(order: OrderData): string {
  return order.orderNumber || order._id?.slice(-5) || '';
}

function bottleWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'бутылей';
  if (mod10 === 1) return 'бутыль';
  if (mod10 >= 2 && mod10 <= 4) return 'бутыля';
  return 'бутылей';
}

const MainOrderCard: React.FC<MainOrderCardProps> = ({
  address,
  orders,
  lastOrder,
  price19,
  price12,
  onChangeAddress,
  onChatWithCourier,
  onRepeatOrder,
  onCreateOrder,
  onCancelOrder,
}) => {
  /** Все активные заказы клиента (в пути показываем раньше принятых). */
  const activeOrders = useMemo(() => {
    const relevant = orders.filter(
      order => order.status === 'onTheWay' || order.status === 'awaitingOrder',
    );
    return [...relevant].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'onTheWay' ? -1 : 1;
    });
  }, [orders]);
  const hasActiveOrder = activeOrders.length > 0;

  /** Все заказы, доставленные сегодня. `orders` (из getActiveOrdersMobile) уже включает
   * их с бэкенда, но подмешиваем и `lastOrder` на случай рассинхронизации двух запросов. */
  const deliveredTodayOrders = useMemo(() => {
    if (hasActiveOrder) return [];
    const today = new Date();
    const isDeliveredToday = (order: OrderData | null | undefined): boolean =>
      !!order &&
      order.status === 'delivered' &&
      isSameDay(order.updatedAt, today);

    const fromOrders = orders.filter(isDeliveredToday);
    const merged = isDeliveredToday(lastOrder)
      ? [
          ...fromOrders.filter(order => order._id !== lastOrder?._id),
          lastOrder as OrderData,
        ]
      : fromOrders;

    return [...merged].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [hasActiveOrder, orders, lastOrder]);
  const hasDeliveredToday = deliveredTodayOrders.length > 0;

  const cancelledLastOrder = useMemo(() => {
    if (hasActiveOrder) return null;
    if (!lastOrder || lastOrder.status !== 'cancelled') return null;
    return lastOrder;
  }, [hasActiveOrder, lastOrder]);

  /** «Повторить заказ» показываем, только если на сегодня нет доставленных заказов
   * (те стоят карточкой до конца дня — см. deliveredTodayOrders) и у клиента вообще
   * есть завершённый (доставленный) заказ в истории. */
  const repeatOrder = useMemo(() => {
    if (hasActiveOrder) return null;
    if (hasDeliveredToday) return null;
    if (cancelledLastOrder) return null;
    if (!lastOrder || lastOrder.status !== 'delivered') return null;
    return lastOrder;
  }, [hasActiveOrder, hasDeliveredToday, cancelledLastOrder, lastOrder]);

  /** Индекс текущей карточки в карусели активных заказов — для точек-индикаторов под ней. */
  const [activeOrderCarouselIndex, setActiveOrderCarouselIndex] = useState(0);
  const handleActiveOrdersScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x /
        (ACTIVE_ORDER_CARD_WIDTH + ACTIVE_ORDER_CARD_GAP),
    );
    setActiveOrderCarouselIndex(index);
  };

  /** Индекс текущей карточки в карусели заказов, доставленных сегодня. */
  const [deliveredOrderCarouselIndex, setDeliveredOrderCarouselIndex] =
    useState(0);
  const handleDeliveredOrdersScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x /
        (ACTIVE_ORDER_CARD_WIDTH + ACTIVE_ORDER_CARD_GAP),
    );
    setDeliveredOrderCarouselIndex(index);
  };

  /** «Изменить» на карточке повтора (или «Заказать ещё») раскрывает форму создания
   * заказа — закрываем её обратно, как только список заказов родителя обновится
   * (значит, новый заказ уже создан и должен сразу попасть в карусель активных),
   * а не только когда меняется конкретно repeatOrder. */
  const [isEditingRepeatOrder, setIsEditingRepeatOrder] = useState(false);
  useEffect(() => {
    setIsEditingRepeatOrder(false);
  }, [repeatOrder?._id, orders.length]);

  /** Адрес и форма создания заказа нужны только когда у клиента вообще нет истории
   * заказов (создание с нуля) или он решил собрать заказ сам через «Изменить». */
  const showCreateOrderBlock = !lastOrder || isEditingRepeatOrder;

  return (
    <>
      {activeOrders.length === 1 ? (
        <ActiveOrderCard
          order={activeOrders[0]}
          onChatWithCourier={onChatWithCourier}
          onCancelOrder={onCancelOrder}
        />
      ) : (
        activeOrders.length > 1 && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ACTIVE_ORDER_CARD_WIDTH + ACTIVE_ORDER_CARD_GAP}
              decelerationRate="fast"
              onScroll={handleActiveOrdersScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.activeOrdersCarousel}>
              {activeOrders.map((order, index) => (
                <View
                  key={order._id}
                  style={[
                    styles.activeOrderCarouselItem,
                    index !== activeOrders.length - 1 && {
                      marginRight: ACTIVE_ORDER_CARD_GAP,
                    },
                  ]}>
                  <CarouselIndexBadge
                    index={index}
                    total={activeOrders.length}
                  />
                  <ActiveOrderCard
                    order={order}
                    onChatWithCourier={onChatWithCourier}
                    onCancelOrder={onCancelOrder}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.activeOrdersDotsRow}>
              {activeOrders.map((order, index) => (
                <View
                  key={order._id}
                  style={[
                    styles.activeOrdersDot,
                    index === activeOrderCarouselIndex &&
                      styles.activeOrdersDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )
      )}

      {hasDeliveredToday &&
        (deliveredTodayOrders.length === 1 ? (
          <DeliveredTodayCard order={deliveredTodayOrders[0]} />
        ) : (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ACTIVE_ORDER_CARD_WIDTH + ACTIVE_ORDER_CARD_GAP}
              decelerationRate="fast"
              onScroll={handleDeliveredOrdersScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.activeOrdersCarousel}>
              {deliveredTodayOrders.map((order, index) => (
                <View
                  key={order._id}
                  style={[
                    styles.activeOrderCarouselItem,
                    index !== deliveredTodayOrders.length - 1 && {
                      marginRight: ACTIVE_ORDER_CARD_GAP,
                    },
                  ]}>
                  <CarouselIndexBadge
                    index={index}
                    total={deliveredTodayOrders.length}
                  />
                  <DeliveredTodayCard order={order} />
                </View>
              ))}
            </ScrollView>
            <View style={styles.activeOrdersDotsRow}>
              {deliveredTodayOrders.map((order, index) => (
                <View
                  key={order._id}
                  style={[
                    styles.activeOrdersDot,
                    index === deliveredOrderCarouselIndex &&
                      styles.activeOrdersDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        ))}

      {cancelledLastOrder && <CancelledOrderCard order={cancelledLastOrder} />}

      {repeatOrder && !isEditingRepeatOrder && (
        <RepeatOrderCard
          order={repeatOrder}
          onRepeatOrder={onRepeatOrder}
          onEdit={() => setIsEditingRepeatOrder(true)}
        />
      )}

      {showCreateOrderBlock && (
        <>
          <AddressSummaryCard
            address={address}
            onChangeAddress={onChangeAddress}
          />
          <CreateOrderCard
            price19={price19}
            price12={price12}
            onCreateOrder={onCreateOrder}
          />
        </>
      )}

      {!showCreateOrderBlock && !repeatOrder && (
        <TouchableOpacity
          style={styles.orderMoreButton}
          onPress={() => setIsEditingRepeatOrder(true)}
          accessibilityRole="button"
          accessibilityLabel="Заказать еще">
          <Image
            source={require('../assets/whiteShoppingBag.png')}
            style={styles.orderMoreIcon}
          />
          <Text style={styles.orderMoreText}>Заказать еще</Text>
        </TouchableOpacity>
      )}
    </>
  );
};

/** Индикатор позиции карточки внутри карусели («1 из 2») — текущий номер красным. */
const CarouselIndexBadge: React.FC<{index: number; total: number}> = ({
  index,
  total,
}) => (
  <Text style={styles.carouselIndexText}>
    <Text style={styles.carouselIndexCurrent}>{index + 1}</Text>
    <Text style={styles.carouselIndexTotal}> из {total}</Text>
  </Text>
);

/** Строка адреса с домиком — переиспользуется внутри карточек заказа. */
const AddressRow: React.FC<{address: OrderAddress}> = ({address}) => (
  <View style={styles.addressRow}>
    <View style={styles.addressIconWrap}>
      <Image
        source={require('../assets/newLocation.png')}
        style={styles.addressIcon}
      />
    </View>
    <View style={{flex: 1}}>
      <Text style={styles.addressTitle}>
        {address.name || 'Адрес доставки'}
      </Text>
      <Text style={styles.addressText}>{address.actual}</Text>
    </View>
  </View>
);

/** Карточка адреса доставки — показывается только при создании заказа с нуля,
 * сразу над блоком создания заказа. */
const AddressSummaryCard: React.FC<{
  address: OrderAddress | null;
  onChangeAddress?: () => void;
}> = ({address, onChangeAddress}) => {
  if (!address) return null;
  return (
    <View style={styles.addressCard}>
      <View style={styles.topAddressRow}>
        <Image
          source={require('../assets/pin.png')}
          style={styles.topAddressPin}
        />
        <View style={styles.topAddressTextWrap}>
          <Text style={styles.addressTitle} numberOfLines={1}>
            {address.name || 'Адрес доставки'}
          </Text>
          <Text
            style={styles.addressText}
            numberOfLines={1}
            ellipsizeMode="tail">
            {address.actual}
          </Text>
        </View>
      </View>
      {onChangeAddress && (
        <TouchableOpacity
          style={styles.changeAddressButton}
          onPress={onChangeAddress}
          accessibilityRole="button"
          accessibilityLabel="Изменить адрес доставки">
          <Text style={styles.changeAddressText}>Изменить</Text>
          <Image
            source={require('../assets/redChevronRight.png')}
            style={{width: 16, height: 16}}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

/** Список позиций заказа в виде отдельных плашек. `onTint` — карточка на цветном фоне (принят/в пути/доставлен), плашки делаем белыми, чтобы они не сливались. */
const ProductRows: React.FC<{products: OrderProduct; onTint?: boolean}> = ({
  products,
  onTint,
}) => (
  <View style={styles.productRows}>
    {buildProductLines(products).map(line => (
      <View
        key={line}
        style={[styles.productRow, onTint && styles.productRowOnTint]}>
        <Image
          source={require('../assets/newDrop.png')}
          style={{width: 16, height: 16}}
        />
        <Text style={styles.productRowText}>{line}</Text>
      </View>
    ))}
  </View>
);

/** Изображение пары бутылей — переиспользуется в карточках заказа справа от списка товаров. */
const BottlePairImage: React.FC<{products?: OrderProduct}> = ({products}) => {
  const isOnly12 = (products?.b12 || 0) > 0 && !(products?.b19 || 0);
  return (
    <View style={styles.bottlePairWrap}>
      <Image
        source={
          isOnly12
            ? require('../assets/towBottles12.png')
            : require('../assets/twoBottles19.png')
        }
        style={{width: 130, height: 130}}
      />
    </View>
  );
};

const ActiveOrderCard: React.FC<{
  order: OrderData;
  onChatWithCourier: (order: OrderData) => void;
  onCancelOrder: (order: OrderData) => void;
}> = ({order, onChatWithCourier, onCancelOrder}) => {
  const isOnTheWay = order.status === 'onTheWay';
  const courierAggregator =
    typeof order.courierAggregator === 'object'
      ? order.courierAggregator
      : undefined;
  const courierLocation =
    courierAggregator?.point && typeof courierAggregator.point.lat === 'number'
      ? {
          latitude: courierAggregator.point.lat,
          longitude: courierAggregator.point.lon,
        }
      : undefined;
  const deliveryLocation = order.address?.point
    ? {latitude: order.address.point.lat, longitude: order.address.point.lon}
    : {latitude: 43.222, longitude: 76.8512};

  const [isMapExpanded, setIsMapExpanded] = useState(false);

  return (
    <View
      style={[
        styles.card,
        isOnTheWay ? styles.cardOnTheWay : styles.cardAwaiting,
      ]}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderTitleGroup}>
          {isOnTheWay ? (
            <Image
              source={require('../assets/greenTruck.png')}
              style={{width: 24, height: 24}}
            />
          ) : (
            <Image
              source={require('../assets/yellowBag.png')}
              style={{width: 24, height: 24}}
            />
          )}
          <Text style={styles.cardTitle}>Активный заказ</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {backgroundColor: isOnTheWay ? '#DFF5E1' : '#FDF1DC'},
          ]}>
          <Text
            style={[
              styles.statusPillText,
              {color: isOnTheWay ? '#1E9E36' : '#EB7E00'},
            ]}>
            {isOnTheWay ? 'В пути' : 'Заказ принят'}
          </Text>
        </View>
      </View>
      {isOnTheWay && (
        <Text style={styles.cardSubtitleMuted}>
          Заказ №{getOrderNumber(order)}
        </Text>
      )}

      <View
        style={[
          styles.sideBySideRow,
          isMapExpanded && styles.sideBySideRowExpanded,
        ]}>
        <View style={styles.sideBySideContent}>
          <ProductRows products={order.products} onTint />
          <AddressRow address={order.address} />
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Доставка сегодня</Text>
          </View>
        </View>

        {isOnTheWay ? (
          <View
            style={[styles.mapWrap, isMapExpanded && styles.mapWrapExpanded]}>
            <View style={styles.mapBadge}>
              <Text style={styles.mapBadgeText}>Скоро прибудет</Text>
            </View>
            <View
              style={[styles.mapSide, isMapExpanded && styles.mapSideExpanded]}>
              <MapProvider
                courierLocation={courierLocation}
                deliveryLocation={deliveryLocation}
                showCourierRoute={!!courierLocation}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsMapExpanded(prev => !prev)}
                style={[
                  styles.mapToggleButton,
                  {borderRadius: !isMapExpanded ? 16 : 6},
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  isMapExpanded ? 'Свернуть карту' : 'Развернуть карту'
                }>
                {isMapExpanded ? (
                  <Image
                    source={require('../assets/decrease.png')}
                    style={{width: 20, height: 20}}
                  />
                ) : (
                  <Image
                    source={require('../assets/increase.png')}
                    style={{width: 20, height: 20}}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <BottlePairImage products={order.products} />
        )}
      </View>

      {isOnTheWay ? (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => onChatWithCourier(order)}
          accessibilityRole="button"
          accessibilityLabel="Написать курьеру">
          <View />
          <Text style={styles.chatButtonText}>Написать курьеру</Text>
          <Image
            source={require('../assets/greenChevronRight.png')}
            style={{width: 16, height: 16}}
          />
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.queueNotice}>
            <Text style={styles.queueNoticeText}>
              Ваш заказ в очереди, пожалуйста, ожидайте
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cancelOrderButton}
            onPress={() => onCancelOrder(order)}
            accessibilityRole="button"
            accessibilityLabel="Отменить заказ">
            <Text style={styles.cancelOrderButtonText}>Отменить заказ</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const DeliveredTodayCard: React.FC<{order: OrderData}> = ({order}) => (
  <View style={[styles.card, styles.cardDelivered]}>
    <View style={styles.cardHeaderRow}>
      <View style={styles.cardHeaderTitleGroup}>
        <View style={[styles.statusIconCircle, {backgroundColor: '#1E9E36'}]}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.cardTitle}>Заказ доставлен</Text>
      </View>
      <View style={styles.datePill}>
        <Text style={styles.datePillText}>{formatDate(order.updatedAt)}</Text>
      </View>
    </View>

    <Text style={styles.cardSubtitleMuted}>
      Заказ №{getOrderNumber(order)} · Сегодня, {formatTime(order.updatedAt)}
    </Text>

    <View style={styles.sideBySideRow}>
      <View style={styles.sideBySideContent}>
        <ProductRows products={order.products} onTint />
        <AddressRow address={order.address} />
      </View>
      <BottlePairImage products={order.products} />
    </View>

    <View style={styles.deliveredNotice}>
      <Text style={styles.deliveredNoticeTitle}>
        Заказ успешно доставлен в {formatTime(order.updatedAt)}
      </Text>
      <Text style={styles.deliveredNoticeSubtitle}>
        Спасибо, что выбираете нас. Ждем вас снова
      </Text>
    </View>
  </View>
);

const CancelledOrderCard: React.FC<{order: OrderData}> = ({order}) => {
  const reasonDisplay = getCancelReasonDisplay(order.reason);
  return (
    <View style={[styles.card, styles.cardCancelled]}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderTitleGroup}>
          <View style={styles.cancelledIconCircle}>
            <View style={styles.cancelledIconLine} />
          </View>
          <Text style={styles.cardTitle}>Заказ не активен</Text>
        </View>
        <View style={[styles.statusPill, styles.cancelledStatusPill]}>
          <Text style={[styles.statusPillText, {color: RED}]}>Отменен</Text>
        </View>
      </View>

      <Text style={styles.cardSubtitleMuted}>
        Заказ №{getOrderNumber(order)}
      </Text>

      <View style={styles.cancelledDivider} />
      <ProductRows products={order.products} onTint />

      <View style={styles.cancelledDivider} />
      <AddressRow address={order.address} />

      <View style={styles.cancelledDivider} />
      <Text style={styles.cancelReasonLabel}>Причина отмены</Text>
      <View style={styles.cancelReasonBox}>
        <Text style={styles.cancelReasonTitle}>{reasonDisplay.title}</Text>
        {reasonDisplay.subtitle && (
          <Text style={styles.cancelReasonSubtitle}>
            {reasonDisplay.subtitle}
          </Text>
        )}
      </View>

      <View style={styles.cancelledDivider} />
      <View style={styles.cancelDateRow}>
        <Image
          source={require('../assets/calendar.png')}
          style={styles.cancelDateIcon}
        />
        <Text style={styles.cancelDateText}>
          Дата отмены: {formatDateTimeNumeric(order.updatedAt)}
        </Text>
      </View>
    </View>
  );
};

const RepeatOrderCard: React.FC<{
  order: OrderData;
  onRepeatOrder: (order: OrderData) => void;
  onEdit: () => void;
}> = ({order, onRepeatOrder, onEdit}) => (
  <View style={styles.card}>
    <View style={styles.cardHeaderTitleGroup}>
      <View style={styles.repeatIconWrap}>
        <Image
          source={require('../assets/newReload.png')}
          style={styles.repeatIcon}
        />
      </View>
      <View>
        <Text style={styles.cardTitle}>Повторить заказ</Text>
        <Text style={styles.cardSubtitleMuted}>
          Мы привезем всё как в прошлый раз
        </Text>
      </View>
    </View>

    <View style={styles.sideBySideRow}>
      <View style={styles.sideBySideContent}>
        <ProductRows products={order.products} />
        <AddressRow address={order.address} />
      </View>
      <BottlePairImage products={order.products} />
    </View>

    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>Итого:</Text>
      <Text style={styles.totalValue}>
        {(order.sum || 0).toLocaleString('ru-RU')} ₸
      </Text>
    </View>

    <View style={styles.repeatButtonsRow}>
      <TouchableOpacity
        style={styles.repeatButtonPrimary}
        onPress={() => onRepeatOrder(order)}
        accessibilityRole="button"
        accessibilityLabel="Повторить заказ">
        <Text style={styles.repeatButtonPrimaryText}>Повторить заказ</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.repeatButtonSecondary}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel="Изменить заказ">
        <Text style={styles.repeatButtonSecondaryText}>Изменить</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const CreateOrderCard: React.FC<{
  price19: number;
  price12: number;
  onCreateOrder: (payload: CreateOrderPayload) => void;
}> = ({price19, price12, onCreateOrder}) => {
  const [volume, setVolume] = useState<OrderVolume>('b19');
  const [quantities, setQuantities] = useState<Record<OrderVolume, number>>({
    b19: MIN_QUANTITY_B19,
    b12: 0,
  });
  /** «Есть пустые бутыли?» — отдельный ответ и счётчик на каждый объём. */
  const [hasEmptyBottles, setHasEmptyBottles] = useState<
    Record<OrderVolume, boolean | null>
  >({b19: null, b12: null});
  const [emptyBottlesCount, setEmptyBottlesCount] = useState<
    Record<OrderVolume, number>
  >({b19: 0, b12: 0});
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);

  const handleConfirmReset = () => {
    setVolume('b19');
    setQuantities({b19: MIN_QUANTITY_B19, b12: 0});
    setHasEmptyBottles({b19: null, b12: null});
    setEmptyBottlesCount({b19: 0, b12: 0});
    setIsResetModalVisible(false);
  };

  const prices: Record<OrderVolume, number> = {b19: price19, b12: price12};
  const totalQuantity = quantities.b19 + quantities.b12;
  const belowMinimumOrder =
    totalQuantity > 0 && totalQuantity < MIN_QUANTITY_B19;
  const effectiveEmptyBottlesCount: Record<OrderVolume, number> = {
    b19: Math.min(emptyBottlesCount.b19, quantities.b19),
    b12: Math.min(emptyBottlesCount.b12, quantities.b12),
  };

  const changeQuantity = (targetVolume: OrderVolume, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [targetVolume]: Math.max(0, prev[targetVolume] + delta),
    }));
  };

  const changeEmptyBottlesCount = (delta: number) => {
    setEmptyBottlesCount(prev => ({
      ...prev,
      [volume]: Math.max(
        0,
        Math.min(
          quantities[volume],
          effectiveEmptyBottlesCount[volume] + delta,
        ),
      ),
    }));
  };

  /** Бутыли, за которые нужна новая тара: без возврата — все заказанные для этого
   * объёма; с частичным возвратом — то, что осталось сверх возвращённых. */
  const newTareByVolume: Record<OrderVolume, number> = useMemo(() => {
    const computeForVolume = (v: OrderVolume): number => {
      if (hasEmptyBottles[v] === false) return quantities[v];
      if (hasEmptyBottles[v] === true) {
        return Math.max(0, quantities[v] - effectiveEmptyBottlesCount[v]);
      }
      return 0;
    };
    return {b19: computeForVolume('b19'), b12: computeForVolume('b12')};
  }, [
    quantities.b19,
    quantities.b12,
    hasEmptyBottles.b19,
    hasEmptyBottles.b12,
    emptyBottlesCount.b19,
    emptyBottlesCount.b12,
  ]);

  const waterSum19 = quantities.b19 * price19;
  const waterSum12 = quantities.b12 * price12;
  const tareSum19 = newTareByVolume.b19 * NEW_TARE_PRICE_B19;
  const tareSum12 = newTareByVolume.b12 * NEW_TARE_PRICE_B12;
  const tareSum = tareSum19 + tareSum12;
  const total = waterSum19 + waterSum12 + tareSum;

  const unresolvedVolumeExists = (['b19', 'b12'] as OrderVolume[]).some(
    v => quantities[v] > 0 && hasEmptyBottles[v] === null,
  );
  const canSubmit =
    totalQuantity > 0 && !belowMinimumOrder && !unresolvedVolumeExists;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreateOrder({
      quantity19: quantities.b19,
      quantity12: quantities.b12,
      hasEmptyBottles: {
        b19: hasEmptyBottles.b19 ?? false,
        b12: hasEmptyBottles.b12 ?? false,
      },
      emptyBottlesCount: effectiveEmptyBottlesCount,
      total,
    });
  };

  return (
    <View>
      <View style={styles.card}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={styles.formTitle}>Что хотите заказать?</Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
            onPress={() => setIsResetModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Сбросить заказ">
            <Text style={{color: '#dc1818', fontWeight: '600'}}>Сбросить</Text>
            <Image
              source={require('../assets/reset.png')}
              style={{width: 20, height: 20}}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.volumeTabsRow}>
          {(['b19', 'b12'] as OrderVolume[]).map(candidate => {
            const selected = candidate === volume;
            return (
              <TouchableOpacity
                key={candidate}
                style={[styles.volumeTab, selected && styles.volumeTabSelected]}
                onPress={() => setVolume(candidate)}
                accessibilityRole="button"
                accessibilityLabel={`Вода ${VOLUME_LABEL[candidate]}`}>
                <Text
                  style={[
                    styles.volumeTabText,
                    selected && styles.volumeTabTextSelected,
                  ]}>
                  {VOLUME_LABEL[candidate]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.productDetailRow}>
          <Image
            source={VOLUME_IMAGE[volume]}
            style={styles.productDetailImage}
          />
          <View style={{flex: 1}}>
            <View style={styles.productDetailHeaderRow}>
              <View>
                <Text style={styles.productDetailTitle}>
                  Вода {VOLUME_LABEL[volume]}
                </Text>
                <Text style={styles.productDetailSubtitle}>негазированная</Text>
              </View>
              <View style={styles.pricePill}>
                <Text style={styles.pricePillLabel}>Цена за 1 шт.</Text>
                <Text style={styles.pricePillValue}>
                  {prices[volume].toLocaleString('ru-RU')} ₸
                </Text>
              </View>
            </View>

            <Text style={styles.stepperLabel}>Количество бутылей</Text>
            <View style={styles.stepperBox}>
              <View style={styles.stepperControlsRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                  onPress={() => changeQuantity(volume, -1)}
                  accessibilityRole="button"
                  accessibilityLabel="Уменьшить количество">
                  <Image
                    source={require('../assets/minus.png')}
                    style={styles.stepperIcon}
                  />
                </TouchableOpacity>
                <View>
                  <Text style={styles.stepperValue}>{quantities[volume]}</Text>
                  <Text style={styles.stepperCaption}>
                    {bottleWord(quantities[volume])}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperButton}
                  hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                  onPress={() => changeQuantity(volume, 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Увеличить количество">
                  <Image
                    source={require('../assets/plus.png')}
                    style={[styles.stepperIcon, {marginTop: -3}]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {hasEmptyBottles[volume] === true && (
              <View style={styles.expandedSection}>
                <Text style={styles.stepperLabel}>
                  Пустые бутыли для возврата
                </Text>
                <Text style={styles.stepperHint}>
                  Сколько пустых бутылей {VOLUME_LABEL[volume]} вернёте курьеру
                </Text>
                <View style={styles.stepperBox}>
                  <View style={styles.stepperControlsRow}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                      onPress={() => changeEmptyBottlesCount(-1)}
                      accessibilityRole="button"
                      accessibilityLabel="Уменьшить количество тары">
                      <Image
                        source={require('../assets/minus.png')}
                        style={styles.stepperIcon}
                      />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>
                      {effectiveEmptyBottlesCount[volume]}
                    </Text>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                      onPress={() => changeEmptyBottlesCount(1)}
                      accessibilityRole="button"
                      accessibilityLabel="Увеличить количество тары">
                      <Image
                        source={require('../assets/plus.png')}
                        style={styles.stepperIcon}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.stepperCaption}>
                    {bottleWord(effectiveEmptyBottlesCount[volume])}
                  </Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    Вы заказали {quantities[volume]}{' '}
                    {bottleWord(quantities[volume])} воды {VOLUME_LABEL[volume]}
                    .{'\n'}
                    Вернёте {effectiveEmptyBottlesCount[volume]}{' '}
                    {bottleWord(effectiveEmptyBottlesCount[volume])}.
                  </Text>
                </View>
              </View>
            )}

            {belowMinimumOrder && (
              <Text style={styles.minOrderNote}>
                Минимальный заказ {MIN_QUANTITY_B19} бутыля.
              </Text>
            )}

            <Text style={styles.stepperLabel}>
              Есть пустые бутыли {VOLUME_LABEL[volume]}?
            </Text>
            <View style={styles.yesNoRow}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  hasEmptyBottles[volume] === true &&
                    styles.yesNoButtonSelected,
                ]}
                onPress={() => {
                  setHasEmptyBottles(prev => ({...prev, [volume]: true}));
                  setEmptyBottlesCount(prev => ({
                    ...prev,
                    [volume]:
                      prev[volume] > 0
                        ? Math.min(prev[volume], quantities[volume])
                        : quantities[volume],
                  }));
                }}
                accessibilityRole="button"
                accessibilityLabel={`Есть пустые бутыли ${VOLUME_LABEL[volume]}`}>
                <View
                  style={[
                    styles.yesNoIndicator,
                    hasEmptyBottles[volume] === true &&
                      styles.yesNoIndicatorSelected,
                  ]}>
                  {hasEmptyBottles[volume] === true && (
                    <Text style={styles.yesNoIndicatorCheck}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.yesNoButtonText,
                    hasEmptyBottles[volume] === true &&
                      styles.yesNoButtonTextSelected,
                  ]}>
                  Да
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  hasEmptyBottles[volume] === false &&
                    styles.yesNoButtonSelected,
                ]}
                onPress={() =>
                  setHasEmptyBottles(prev => ({...prev, [volume]: false}))
                }
                accessibilityRole="button"
                accessibilityLabel={`Нет пустых бутылей ${VOLUME_LABEL[volume]}`}>
                <View
                  style={[
                    styles.yesNoIndicator,
                    hasEmptyBottles[volume] === false &&
                      styles.yesNoIndicatorSelected,
                  ]}>
                  {hasEmptyBottles[volume] === false && (
                    <Text style={styles.yesNoIndicatorCheck}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.yesNoButtonText,
                    hasEmptyBottles[volume] === false &&
                      styles.yesNoButtonTextSelected,
                  ]}>
                  Нет
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalBreakdown}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Итого:</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString('ru-RU')} ₸
            </Text>
          </View>
          {quantities.b19 > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Вода {VOLUME_LABEL.b19} ({quantities.b19} шт)
              </Text>
              <Text style={styles.breakdownValue}>
                {waterSum19.toLocaleString('ru-RU')} ₸
              </Text>
            </View>
          )}
          {quantities.b12 > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Вода {VOLUME_LABEL.b12} ({quantities.b12} шт)
              </Text>
              <Text style={styles.breakdownValue}>
                {waterSum12.toLocaleString('ru-RU')} ₸
              </Text>
            </View>
          )}
          {newTareByVolume.b19 > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Новая тара {VOLUME_LABEL.b19} ({newTareByVolume.b19} шт.)
              </Text>
              <Text style={styles.breakdownValue}>
                {tareSum19.toLocaleString('ru-RU')} ₸
              </Text>
            </View>
          )}
          {newTareByVolume.b12 > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Новая тара {VOLUME_LABEL.b12} ({newTareByVolume.b12} шт.)
              </Text>
              <Text style={styles.breakdownValue}>
                {tareSum12.toLocaleString('ru-RU')} ₸
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Оформить заказ">
          <Text style={styles.submitButtonText}>Оформить заказ</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isResetModalVisible}
        onRequestClose={() => setIsResetModalVisible(false)}
        transparent
        animationType="fade">
        <TouchableOpacity
          style={styles.resetModalOverlay}
          activeOpacity={1}
          onPress={() => setIsResetModalVisible(false)}>
          <TouchableOpacity
            style={styles.resetModalContainer}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <View style={styles.resetModalIconWrap}>
              <Text style={styles.resetModalIconText}>!</Text>
            </View>
            <Text style={styles.resetModalTitle}>Сбросить заказ?</Text>
            <Text style={styles.resetModalSubtitle}>
              Все выбранные товары и количество{'\n'}будут удалены.
            </Text>
            <View style={styles.resetModalButtonsRow}>
              <TouchableOpacity
                style={styles.resetModalCancelButton}
                onPress={() => setIsResetModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Отмена">
                <Text style={styles.resetModalCancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetModalConfirmButton}
                onPress={handleConfirmReset}
                accessibilityRole="button"
                accessibilityLabel="Сбросить">
                <Text style={styles.resetModalConfirmButtonText}>Сбросить</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activeOrdersCarousel: {
    paddingRight: CONTENT_HORIZONTAL_PADDING,
  },
  activeOrderCarouselItem: {
    width: ACTIVE_ORDER_CARD_WIDTH,
  },
  activeOrdersDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  activeOrdersDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D9D9D9',
  },
  activeOrdersDotActive: {
    backgroundColor: RED,
    width: 16,
  },
  carouselIndexText: {
    marginTop: 16,
    marginBottom: -8,
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  carouselIndexCurrent: {
    color: RED,
  },
  carouselIndexTotal: {
    color: '#545454',
  },
  cardOnTheWay: {
    backgroundColor: '#F1FAF2',
    borderWidth: 1,
    borderColor: '#BFE6C4',
  },
  cardAwaiting: {
    backgroundColor: '#FFFAF4',
    borderWidth: 1,
    borderColor: '#F5DFB0',
  },
  cardDelivered: {
    backgroundColor: '#F1FAF2',
    borderWidth: 1,
    borderColor: '#BFE6C4',
  },
  cardCancelled: {
    backgroundColor: '#FDF4F4',
    borderWidth: 1,
    borderColor: '#F5D6D6',
  },
  cancelledIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cancelledIconLine: {
    width: 2,
    height: 34,
    backgroundColor: RED,
    transform: [{rotate: '45deg'}],
  },
  cancelledStatusPill: {
    backgroundColor: '#FBDCDC',
  },
  cancelledDivider: {
    height: 1,
    backgroundColor: '#F0D9D9',
    marginTop: 12,
    marginBottom: 4,
  },
  cancelReasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#545454',
    marginTop: 8,
    marginBottom: 8,
  },
  cancelReasonBox: {
    backgroundColor: '#FBEAEA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cancelReasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101010',
  },
  cancelReasonSubtitle: {
    fontSize: 13,
    color: '#8A6A6A',
    marginTop: 2,
  },
  cancelDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  cancelDateIcon: {
    width: 18,
    height: 18,
  },
  cancelDateText: {
    fontSize: 13,
    color: '#545454',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  checkIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
  },
  cardSubtitleMuted: {
    fontSize: 13,
    color: '#545454',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  datePill: {
    backgroundColor: '#EDEDED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#101010',
  },
  productRows: {
    marginTop: 8,
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  productRowOnTint: {
    backgroundColor: 'white',
  },
  productDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3D9BE9',
  },
  productRowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#101010',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  addressIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressIcon: {
    width: 12,
    height: 18,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101010',
  },
  addressText: {
    fontSize: 13,
    color: '#545454',
    marginTop: 2,
  },
  metaRow: {
    marginTop: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#545454',
  },
  sideBySideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  sideBySideRowExpanded: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  sideBySideContent: {
    flex: 1,
  },
  mapSide: {
    width: 130,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapSideExpanded: {
    width: '100%',
    height: 225,
    marginTop: 12,
  },
  mapWrap: {
    width: 130,
  },
  mapWrapExpanded: {
    width: '100%',
  },
  mapBadge: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#101010',
  },
  mapToggleButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#23924b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  mapToggleButtonIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101010',
  },
  bottlePairWrap: {
    width: 130,
    height: 150,
  },
  bottlePairImage: {
    position: 'absolute',
    width: 80,
    height: 140,
    resizeMode: 'contain',
  },
  bottlePairImageBack: {
    left: 0,
    top: 10,
  },
  bottlePairImageFront: {
    left: 40,
    top: 0,
  },
  chatButton: {
    marginTop: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#1E9E36',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E9E36',
  },
  chatButtonChevron: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E9E36',
  },
  queueNotice: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F5C669',
    backgroundColor: '#FFF9EE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  queueNoticeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A6116',
    textAlign: 'center',
  },
  cancelOrderButton: {
    marginTop: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cancelOrderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: RED,
  },
  deliveredNotice: {
    marginTop: 12,
    backgroundColor: '#E7F7E9',
    borderRadius: 10,
    padding: 12,
  },
  deliveredNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E9E36',
  },
  deliveredNoticeSubtitle: {
    fontSize: 13,
    color: '#3E6B45',
    marginTop: 4,
  },
  repeatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatIcon: {
    width: 22,
    height: 22,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#545454',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: RED,
  },
  repeatButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  repeatButtonPrimary: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  repeatButtonPrimaryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  repeatButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  repeatButtonSecondaryText: {
    color: RED,
    fontSize: 14,
    fontWeight: '600',
  },
  addressCard: {
    marginTop: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  changeAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: RED,
  },
  changeAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginLeft: 8,
  },
  topAddressRow: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topAddressTextWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  topAddressPin: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101010',
    marginBottom: 12,
  },
  volumeTabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  volumeTab: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  volumeTabSelected: {
    borderColor: RED,
    backgroundColor: '#FFF5F5',
  },
  volumeTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101010',
  },
  volumeTabTextSelected: {
    color: RED,
  },
  productDetailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  productDetailImage: {
    width: 90,
    height: 150,
    resizeMode: 'contain',
  },
  productDetailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101010',
  },
  productDetailSubtitle: {
    fontSize: 13,
    color: '#545454',
    marginTop: 2,
  },
  pricePill: {
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  pricePillLabel: {
    fontSize: 11,
    color: '#545454',
  },
  pricePillValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101010',
    marginTop: 2,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#101010',
    marginTop: 16,
  },
  stepperHint: {
    fontSize: 12,
    color: '#545454',
    marginTop: 2,
  },
  stepperBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    width: '80%',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  stepperControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepperCaption: {
    fontSize: 12,
    color: '#545454',
    marginTop: 2,
  },
  stepperButton: {
    padding: 4,
  },
  stepperIcon: {
    width: 18,
    height: 18,
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
    minWidth: 24,
    textAlign: 'center',
  },
  minOrderNote: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: RED,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  yesNoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  yesNoButtonSelected: {
    borderColor: RED,
    backgroundColor: '#FFF5F5',
  },
  yesNoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101010',
  },
  yesNoButtonTextSelected: {
    color: RED,
  },
  yesNoIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#B0B0B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesNoIndicatorSelected: {
    borderColor: RED,
    backgroundColor: RED,
  },
  yesNoIndicatorCheck: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  expandedSection: {
    marginTop: 4,
  },
  infoBox: {
    marginTop: 12,
    backgroundColor: '#EAF3FC',
    borderRadius: 10,
    padding: 12,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#2A5C8A',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDEDED',
    marginTop: 16,
    marginBottom: 12,
  },
  totalBreakdown: {
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#545454',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#101010',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E3A5A5',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orderMoreButton: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 14,
  },
  orderMoreIcon: {
    width: 20,
    height: 20,
  },
  orderMoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resetModalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetModalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBDCDC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resetModalIconText: {
    color: RED,
    fontSize: 22,
    fontWeight: '700',
  },
  resetModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
    marginBottom: 8,
  },
  resetModalSubtitle: {
    fontSize: 14,
    color: '#545454',
    textAlign: 'center',
    lineHeight: 20,
  },
  resetModalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  resetModalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetModalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101010',
  },
  resetModalConfirmButton: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetModalConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default MainOrderCard;
