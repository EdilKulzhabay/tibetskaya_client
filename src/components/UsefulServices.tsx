import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

interface ServiceCardConfig {
  key: string;
  icon: ReturnType<typeof require>;
  iconTint?: string;
  iconBg: string;
  iconWidth?: number;
  iconHeight?: number;
  title: string;
  subtitle: string;
  onPress: () => void;
}

interface UsefulServicesProps {
  /** Показывать карточку «Ремонт техники» (управляется в CRM, см. user.showRepairMasterInApp). */
  showRepair: boolean;
  onRepairPress: () => void;
  onInvitePress: () => void;
  onMarketplacePress: () => void;
}

const ServiceCard: React.FC<{config: ServiceCardConfig}> = ({config}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={config.onPress}
    accessibilityRole="button"
    accessibilityLabel={config.title}>
    <View style={styles.cardTopRow}>
      <View style={[styles.iconBox, {backgroundColor: config.iconBg}]}>
        <Image
          source={config.icon}
          style={[
            styles.icon,
            {
              tintColor: config.iconTint,
              width: config.iconWidth ?? styles.icon.width,
              height: config.iconHeight ?? styles.icon.height,
            },
          ]}
        />
      </View>
      <Image
        source={require('../assets/redChevronRight.png')}
        style={styles.chevron}
      />
    </View>
    <Text style={styles.cardTitle} numberOfLines={1}>
      {config.title}
    </Text>
    <Text style={styles.cardSubtitle} numberOfLines={1}>
      {config.subtitle}
    </Text>
  </TouchableOpacity>
);

/** Блок «Полезные сервисы» на главном экране — ремонт техники, реферальная программа, маркетплейс. */
const UsefulServices: React.FC<UsefulServicesProps> = ({
  showRepair,
  onRepairPress,
  onInvitePress,
  onMarketplacePress,
}) => {
  const cards: ServiceCardConfig[] = [
    {
      key: 'repair',
      icon: require('../assets/newMainFix.png'),
      iconTint: '#EB7E00',
      iconBg: '#FDF1DC',
      iconWidth: 34,
      iconHeight: 34,
      title: 'Ремонт техники',
      subtitle: 'Вызвать мастера',
      onPress: onRepairPress,
    },
    {
      key: 'invite',
      icon: require('../assets/refPresent.png'),
      iconTint: '#1E9E36',
      iconBg: '#DFF5E1',
      iconWidth: 24,
      iconHeight: 24,
      title: 'Пригласи друга',
      subtitle: 'Получайте бонусы',
      onPress: onInvitePress,
    },
    {
      key: 'marketplace',
      icon: require('../assets/blueBag.png'),
      iconBg: '#FFF',
      iconWidth: 24,
      iconHeight: 24,
      title: 'Маркетплейс',
      subtitle: 'WaterClub Тибетская',
      onPress: onMarketplacePress,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Полезные сервисы</Text>
      <View style={styles.row}>
        {cards.map(config => (
          <ServiceCard key={config.key} config={config} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101010',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  chevron: {
    width: 14,
    height: 14,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#101010',
    marginTop: 8,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6A7282',
    marginTop: 2,
  },
});

export default UsefulServices;
