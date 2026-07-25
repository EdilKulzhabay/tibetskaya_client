import React, {useEffect, useState, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  DeviceEventEmitter,
} from 'react-native';
import {Back} from '../components';
import {useAuth} from '../hooks';
import {apiService} from '../api/services';
import {SupportMessage} from '../types';
import {getClientMongoId} from '../utils/clientId';

const ChatScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user} = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>(
    user?.supportMessages || [],
  );
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const isUserScrollingRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = async () => {
    if (inputText.trim()) {
      // Закрываем клавиатуру перед отправкой
      Keyboard.dismiss();

      const newMessage = {
        _id: '',
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date().toISOString(),
        isRead: false,
      } as SupportMessage;

      const res = await apiService.sendSupportMessage(
        getClientMongoId(user),
        newMessage,
      );
      console.log('res in ChatScreen.tsx = ', res);
      if (res.success) {
        const newMessages = [
          ...messages,
          res.messages[res.messages.length - 1] as SupportMessage,
        ];
        setMessages(newMessages);
        // Прокручиваем вниз после добавления нового сообщения
        setTimeout(() => {
          if (flatListRef.current && shouldAutoScrollRef.current) {
            flatListRef.current.scrollToEnd({animated: true});
          }
        }, 100);
      } else {
        Alert.alert('Ошибка', res.message);
      }
      setInputText('');
    }
  };

  const renderMessage = ({item: message}: {item: SupportMessage}) => {
    return (
      <View
        style={[
          styles.messageContainer,
          message.isUser
            ? styles.userMessageContainer
            : styles.supportMessageContainer,
        ]}>
        {/* Пузырь с сообщением */}
        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userBubble : styles.supportBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              message.isUser
                ? styles.userMessageText
                : styles.supportMessageText,
            ]}>
            {message.text}
          </Text>
        </View>

        {/* Информация о сообщении */}
        <View style={styles.messageInfo}>
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {message.isUser && (
            <Text
              style={
                message.isRead ? styles.readStatusRead : styles.readStatus
              }>
              {message.isRead ? ' • Прочитано' : ' • Отправлено'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const keyExtractor = (item: SupportMessage, index: number) => {
    return item._id || `message-${index}`;
  };

  // Загрузка сообщений при монтировании или изменении email
  useEffect(() => {
    const clientId = getClientMongoId(user);
    const getMessages = async () => {
      if (clientId) {
        const res = await apiService.getSupportMessages(clientId);
        if (res.success) {
          setMessages(res.messages as SupportMessage[]);
        }
      }
    };
    getMessages();
  }, [user]);

  // Автоматический скролл в конец при загрузке сообщений
  useEffect(() => {
    if (
      messages.length > 0 &&
      shouldAutoScrollRef.current &&
      !isUserScrollingRef.current
    ) {
      // Используем небольшую задержку для корректного рендеринга
      const timeoutId = setTimeout(() => {
        if (
          flatListRef.current &&
          shouldAutoScrollRef.current &&
          !isUserScrollingRef.current
        ) {
          flatListRef.current.scrollToEnd({animated: false});
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]);

  // Слушатель новых сообщений поддержки через push-уведомления
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'newSupportMessage',
      (newMessage: SupportMessage) => {
        console.log('💬 Получено новое сообщение поддержки:', newMessage);
        setMessages(prevMessages => {
          // Проверяем, нет ли уже такого сообщения (по _id или по тексту и времени)
          const exists = prevMessages.some(
            msg =>
              msg._id === newMessage._id ||
              (msg.text === newMessage.text &&
                msg.timestamp === newMessage.timestamp),
          );
          if (exists) {
            console.log('⚠️ Сообщение уже существует, пропускаем');
            return prevMessages;
          }
          const updated = [...prevMessages, newMessage];
          // Скроллим в конец после добавления нового сообщения только если пользователь не прокручивает
          setTimeout(() => {
            if (
              flatListRef.current &&
              shouldAutoScrollRef.current &&
              !isUserScrollingRef.current
            ) {
              flatListRef.current.scrollToEnd({animated: true});
            }
          }, 100);
          return updated;
        });
      },
    );

    return () => {
      subscription.remove();
      // Очищаем таймаут при размонтировании
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleTouchEnd = () => {
    // Сбрасываем флаги при окончании взаимодействия
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      shouldAutoScrollRef.current = true;
      scrollTimeoutRef.current = null;
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="Чат поддержка" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* Область для скрытия клавиатуры - вне FlatList */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.touchableArea} />
        </TouchableWithoutFeedback>

        {/* Список сообщений - без TouchableWithoutFeedback */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          onScrollBeginDrag={() => {
            // Пользователь начал прокручивать вручную - отключаем автоскролл
            isUserScrollingRef.current = true;
            shouldAutoScrollRef.current = false;
            // Очищаем предыдущий таймаут
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
              scrollTimeoutRef.current = null;
            }
          }}
          onScrollEndDrag={() => {
            handleTouchEnd();
          }}
          onMomentumScrollEnd={() => {
            handleTouchEnd();
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Нет сообщений</Text>
              <Text style={styles.emptySubtext}>
                Начните разговор с поддержкой
              </Text>
            </View>
          }
        />

        {/* Поле ввода - снизу, всегда доступно */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Напишите что-то..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  touchableArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: -1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  supportMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC1818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    color: 'white',
    fontSize: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#DC1818',
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  supportMessageText: {
    color: '#333',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  readStatus: {
    fontSize: 11,
    color: '#999',
  },
  readStatusRead: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC1818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.5,
  },
  sendIcon: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default ChatScreen;
