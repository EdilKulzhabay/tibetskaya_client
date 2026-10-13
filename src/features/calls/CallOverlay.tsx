import {useEffect, useState} from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CallState} from './callManager';
import {callPlatform} from './callPlatform';
import {callManager, useCallSnapshot} from './callStore';
import {CALL_COLORS, CALL_SIZES} from './callTheme';

const TIMER_TICK_MS = 1000;

/**
 * Белые PNG (Ionicons, как в приложении курьера), цвет задаётся tintColor:
 * в клиентском приложении нет библиотеки иконок, а эмодзи не перекрасить.
 */
const ICONS = {
  call: require('../../assets/calls/call.png'),
  decline: require('../../assets/calls/close.png'),
  micOn: require('../../assets/calls/mic.png'),
  micOff: require('../../assets/calls/mic_off.png'),
  speaker: require('../../assets/calls/volume_high.png'),
} satisfies Record<string, ImageSourcePropType>;

const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`;
};

/** Отдельный компонент, чтобы ежесекундно перерисовывался только таймер */
function CallTimer({connectedAt}: {connectedAt: number}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TIMER_TICK_MS);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - connectedAt) / 1000));
  return <Text style={styles.status}>{formatDuration(seconds)}</Text>;
}

function CallStatus({call}: {call: CallState}) {
  switch (call.phase) {
    case 'outgoing':
      return <Text style={styles.status}>Вызов…</Text>;
    case 'incoming':
      return <Text style={styles.status}>Входящий звонок</Text>;
    case 'connecting':
      return <Text style={styles.status}>Соединение…</Text>;
    case 'active':
      return call.isReconnecting ? (
        <Text style={styles.status}>Восстанавливаем связь…</Text>
      ) : (
        <CallTimer connectedAt={call.connectedAt} />
      );
    case 'ended':
      return <Text style={styles.status}>{call.message}</Text>;
    default:
      return null;
  }
}

interface RoundButtonProps {
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
  variant: 'accept' | 'decline' | 'control';
  isActive?: boolean;
  isDisabled?: boolean;
}

function RoundButton({
  icon,
  label,
  onPress,
  variant,
  isActive = false,
  isDisabled = false,
}: RoundButtonProps) {
  const isMain = variant !== 'control';
  const iconColor =
    variant === 'control' && !isActive
      ? CALL_COLORS.controlIcon
      : CALL_COLORS.iconOnColor;
  return (
    <View style={styles.buttonWrapper}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[
          isMain ? styles.mainButton : styles.controlButton,
          variant === 'accept' && styles.accept,
          variant === 'decline' && styles.decline,
          variant === 'control' &&
            (isActive ? styles.controlActive : styles.control),
          isDisabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={
          variant === 'control'
            ? {selected: isActive, disabled: isDisabled}
            : undefined
        }>
        <Image
          source={icon}
          style={isMain ? styles.mainIcon : styles.controlIcon}
          tintColor={iconColor}
          importantForAccessibility="no"
        />
      </TouchableOpacity>
      <Text style={styles.buttonLabel}>{label}</Text>
    </View>
  );
}

/** Полноэкранный экран звонка поверх любого экрана приложения. */
export default function CallOverlay() {
  const {call, isMuted, isSpeakerOn} = useCallSnapshot();
  // На iOS входящий показывает CallKit — свой экран появится после ответа
  const isIncomingShownBySystem =
    call.phase === 'incoming' && callPlatform.systemUi.showsIncomingUi;
  if (call.phase === 'idle' || isIncomingShownBySystem) {
    return null;
  }

  const isIncoming = call.phase === 'incoming';
  const isEnded = call.phase === 'ended';

  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => callManager.hangup()}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>Тибетская</Text>
          <Text style={styles.name} numberOfLines={2}>
            {call.peerName}
          </Text>
          <CallStatus call={call} />
        </View>

        {isIncoming && (
          <View style={styles.row}>
            <RoundButton
              icon={ICONS.decline}
              label="Отклонить"
              variant="decline"
              onPress={() => callManager.reject()}
            />
            <RoundButton
              icon={ICONS.call}
              label="Ответить"
              variant="accept"
              onPress={() => callManager.accept()}
            />
          </View>
        )}

        {!isIncoming && !isEnded && (
          <View style={styles.footer}>
            <View style={styles.row}>
              <RoundButton
                icon={isMuted ? ICONS.micOff : ICONS.micOn}
                label="Микрофон"
                variant="control"
                isActive={isMuted}
                // До соединения микрофон ещё не захвачен — mute применить не к чему
                isDisabled={call.phase !== 'active'}
                onPress={() => callManager.toggleMute()}
              />
              <RoundButton
                icon={ICONS.speaker}
                label="Динамик"
                variant="control"
                isActive={isSpeakerOn}
                onPress={() => callManager.toggleSpeaker()}
              />
            </View>
            <RoundButton
              icon={ICONS.decline}
              label="Завершить"
              variant="decline"
              onPress={() => callManager.hangup()}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CALL_COLORS.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
  },
  brand: {
    color: CALL_COLORS.brand,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 48,
  },
  name: {
    color: CALL_COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  status: {
    color: CALL_COLORS.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    gap: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignSelf: 'stretch',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  mainButton: {
    width: CALL_SIZES.mainButton,
    height: CALL_SIZES.mainButton,
    borderRadius: CALL_SIZES.mainButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: CALL_SIZES.controlButton,
    height: CALL_SIZES.controlButton,
    borderRadius: CALL_SIZES.controlButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIcon: {
    width: CALL_SIZES.mainIcon,
    height: CALL_SIZES.mainIcon,
  },
  controlIcon: {
    width: CALL_SIZES.controlIcon,
    height: CALL_SIZES.controlIcon,
  },
  accept: {
    backgroundColor: CALL_COLORS.accept,
  },
  decline: {
    backgroundColor: CALL_COLORS.decline,
  },
  control: {
    backgroundColor: CALL_COLORS.controlBackground,
  },
  controlActive: {
    backgroundColor: CALL_COLORS.controlActiveBackground,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    color: CALL_COLORS.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
});
