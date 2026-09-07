import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Keyboard,
} from 'react-native';
import {OrderData} from '../types/navigation';

type Props = {
  visible: boolean;
  order: OrderData | null;
  submitting?: boolean;
  onSubmit: (rating: number, comment: string) => void;
  onDismiss: () => void;
};

const STARS = [1, 2, 3, 4, 5];
const COMMENT_MAX_LENGTH = 300;

const ReviewModal: React.FC<Props> = ({
  visible,
  order,
  submitting,
  onSubmit,
  onDismiss,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
    }
  }, [visible, order?._id]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View
        style={[styles.overlay, isKeyboardVisible && styles.overlayKeyboard]}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}>
            <View style={styles.badgeWrap}>
              <Text style={[styles.heart, styles.heartTopLeft]}>💗</Text>
              <Text style={[styles.heart, styles.heartTopRight]}>💗</Text>
              <View style={styles.badgeCircle}>
                <Image
                  source={require('../assets/appLogoMark.png')}
                  style={styles.badgeImage}
                />
              </View>
              <Text style={[styles.heart, styles.heartBottom]}>💗</Text>
            </View>

            <Text style={styles.title}>Спасибо за заказ!</Text>
            <Text style={styles.subtitle}>Мы успешно доставили воду.</Text>

            <View style={styles.divider} />

            <Text style={styles.question}>Как прошёл ваш заказ?</Text>
            <Text style={styles.questionHint}>
              Ваш отзыв поможет нам стать лучше и радовать вас ещё больше.
            </Text>

            <View style={styles.starsRow}>
              {STARS.map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  accessibilityRole="button"
                  accessibilityLabel={`Оценка ${star} из 5`}
                  hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}>
                  <Text
                    style={[
                      styles.star,
                      star <= rating ? styles.starSelected : styles.starEmpty,
                    ]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.starsHint}>
              {rating > 0
                ? 'Спасибо за оценку!'
                : 'Нажмите на звёзды, чтобы оценить'}
            </Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Поделитесь впечатлениями (по желанию)"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={COMMENT_MAX_LENGTH}
              value={comment}
              onChangeText={setComment}
            />
            <Text style={styles.commentCounter}>
              {comment.length}/{COMMENT_MAX_LENGTH}
            </Text>

            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Text style={styles.trustIcon}>🛡️</Text>
                <Text style={styles.trustText}>Мы читаем каждый отзыв</Text>
              </View>
              <View style={styles.trustItem}>
                <Text style={styles.trustIcon}>❤️</Text>
                <Text style={styles.trustText}>
                  Спасибо, что помогаете нам становиться лучше!
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                rating === 0 && styles.submitBtnDisabled,
              ]}
              disabled={rating === 0 || submitting}
              onPress={() => onSubmit(rating, comment.trim())}>
              <Text style={styles.submitBtnText}>
                {submitting ? 'Отправляем…' : 'Отправить отзыв'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissBtnText}>В другой раз</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const RED = '#DC1818';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 420,
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
  },
  badgeWrap: {
    width: 100,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: RED,
  },
  badgeImage: {
    width: 72,
    height: 72,
  },
  heart: {
    position: 'absolute',
    fontSize: 16,
  },
  heartTopLeft: {
    top: 0,
    left: 6,
  },
  heartTopRight: {
    top: 4,
    right: 0,
  },
  heartBottom: {
    bottom: 0,
    right: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101010',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6A7282',
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101010',
    textAlign: 'center',
  },
  questionHint: {
    fontSize: 13,
    color: '#6A7282',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  star: {
    fontSize: 32,
  },
  starEmpty: {
    color: '#D1D5DB',
  },
  starSelected: {
    color: RED,
  },
  starsHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  commentInput: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#101010',
    textAlignVertical: 'top',
  },
  commentCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 16,
  },
  trustRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  trustItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  trustIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  trustText: {
    flex: 1,
    fontSize: 11,
    color: '#6A7282',
  },
  submitBtn: {
    backgroundColor: RED,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingVertical: 4,
  },
  dismissBtnText: {
    color: RED,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ReviewModal;
