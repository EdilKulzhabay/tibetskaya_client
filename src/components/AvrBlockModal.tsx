import React from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const AvrBlockModal: React.FC<Props> = ({visible, onClose}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            Подтвердите АВР
          </Text>
          <Text style={styles.subtitle}>
            Доступ к приложению временно приостановлен. Чтобы продолжить
            пользоваться приложением, подтвердите акт выполненных работ (АВР) на
            портале ИС ЭСФ.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onClose}
            accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Понятно</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101010',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: '#6A7282',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#DC1818',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AvrBlockModal;
