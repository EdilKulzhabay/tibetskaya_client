import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {apiService} from '../api/services';
import {useAuth} from '../hooks/useAuth';
import {getClientMongoId} from '../utils/clientId';
import type {OrderData} from '../types/navigation';

/** Должно совпадать с ORDER_COMMENT_MAX_LENGTH в crm/Controllers/MobileController.js */
const COMMENT_MAX_LENGTH = 300;
const RED = '#DC1818';

interface OrderCommentSectionProps {
  order: OrderData;
}

/**
 * Комментарий курьеру для заказа, который ещё не в пути: кнопка «Добавить комментарий»
 * или блок с текстом и «Изменить», редактирование — в bottom sheet.
 */
export default function OrderCommentSection({order}: OrderCommentSectionProps) {
  const {user} = useAuth();
  /** Сохранённое значение перекрывает order.comment, пока список заказов не перезагрузится. */
  const [savedComment, setSavedComment] = useState<string | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const comment = savedComment ?? order.comment?.trim() ?? '';

  const openSheet = () => {
    setDraft(comment);
    setIsSheetVisible(true);
  };

  const closeSheet = () => {
    if (!isSaving) {
      setIsSheetVisible(false);
    }
  };

  const handleSave = async () => {
    const clientId = getClientMongoId(user);
    if (!clientId || isSaving) {
      return;
    }
    Keyboard.dismiss();
    setIsSaving(true);
    const res = await apiService.updateOrderComment(
      order._id,
      clientId,
      draft.trim(),
    );
    setIsSaving(false);
    if (!res.success) {
      Alert.alert('Ошибка', res.message || 'Не удалось сохранить комментарий');
      return;
    }
    setSavedComment(res.comment ?? draft.trim());
    setIsSheetVisible(false);
  };

  return (
    <>
      {comment ? (
        <View style={styles.commentBox}>
          <View style={styles.commentHeaderRow}>
            <Text style={styles.commentLabel}>Комментарий курьеру</Text>
            <TouchableOpacity
              onPress={openSheet}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              accessibilityRole="button"
              accessibilityLabel="Изменить комментарий">
              <Text style={styles.editText}>Изменить</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.commentText}>{comment}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={openSheet}
          accessibilityRole="button"
          accessibilityLabel="Добавить комментарий">
          <Text style={styles.addButtonText}>Добавить комментарий</Text>
          <Image
            source={require('../assets/arrowRight.png')}
            style={styles.chevron}
            tintColor="#6A7282"
          />
        </TouchableOpacity>
      )}

      <Modal
        visible={isSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
        statusBarTranslucent={Platform.OS === 'android'}>
        {/* padding на обеих платформах: на Android (edge-to-edge) окно модалки
            не сжимается по adjustResize, и клавиатура перекрыла бы лист */}
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <Pressable style={styles.overlay} onPress={closeSheet}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle} accessibilityRole="header">
                  Комментарий к заказу
                </Text>
                <TouchableOpacity
                  onPress={closeSheet}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  accessibilityRole="button"
                  accessibilityLabel="Закрыть">
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetSubtitle}>
                Курьер увидит его в заказе
              </Text>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="Например: не звоните в домофон"
                placeholderTextColor="#A0A6B1"
                multiline
                maxLength={COMMENT_MAX_LENGTH}
                textAlignVertical="top"
                autoFocus
                selectionColor={RED}
                accessibilityLabel="Комментарий к заказу"
              />
              <Text style={styles.counter}>
                {draft.length}/{COMMENT_MAX_LENGTH}
              </Text>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonBusy]}
                onPress={handleSave}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityState={{disabled: isSaving, busy: isSaving}}>
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Сохранить</Text>
                )}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  addButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  addButtonText: {
    fontSize: 15,
    color: '#6A7282',
  },
  chevron: {
    width: 16,
    height: 16,
  },
  commentBox: {
    marginTop: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4A5565',
  },
  editText: {
    fontSize: 13,
    fontWeight: '500',
    color: RED,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#101010',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E3E3E3',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101010',
  },
  closeIcon: {
    fontSize: 20,
    color: '#4A5565',
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6A7282',
  },
  input: {
    marginTop: 16,
    minHeight: 88,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#D1D5DC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#101010',
  },
  counter: {
    marginTop: 6,
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#8A8A8A',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: RED,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonBusy: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
