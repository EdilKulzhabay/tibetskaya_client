import React, { useEffect, useState, useRef } from 'react';
import {
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
  DeviceEventEmitter
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {androidOnlySafeAreaEdges} from '../utils/safeArea';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Back } from '../components';
import { apiService } from '../api/services';
import { OrderChatMessage } from '../types';
import { RootStackParamList } from '../types/navigation';

type CourierChatRouteProp = RouteProp<RootStackParamList, 'CourierChat'>;

const CourierChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const route = useRoute<CourierChatRouteProp>();
  const { order } = route.params;
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const isUserScrollingRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = async () => {
    if (inputText.trim()) {
      Keyboard.dismiss();
      const text = inputText.trim();
      setInputText('');

      const res = await apiService.sendOrderChatMessage(order._id, text);
      if (res.success) {
        const newMessages = res.messages as OrderChatMessage[];
        setMessages(newMessages);
        setTimeout(() => {
          if (flatListRef.current && shouldAutoScrollRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      } else {
        Alert.alert('Ошибка', res.message);
      }
    }
  };

  const renderMessage = ({ item: message }: { item: OrderChatMessage }) => {
    const isClient = message.sender === 'client';
    return (
      <View
        style={[
          styles.messageContainer,
          isClient ? styles.userMessageContainer : styles.supportMessageContainer
        ]}
      >
        <View style={[
          styles.messageBubble,
          isClient ? styles.userBubble : styles.supportBubble
        ]}>
          <Text style={[
            styles.messageText,
            isClient ? styles.userMessageText : styles.supportMessageText
          ]}>
            {message.text}
          </Text>
        </View>

        <View style={styles.messageInfo}>
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  const keyExtractor = (item: OrderChatMessage, index: number) => {
    return item._id || `message-${index}`;
  };

  useEffect(() => {
    const getMessages = async () => {
      const res = await apiService.getOrderChatMessages(order._id);
      if (res.success) {
        setMessages(res.messages as OrderChatMessage[]);
      }
    };
    getMessages();
  }, [order._id]);

  useEffect(() => {
    if (messages.length > 0 && shouldAutoScrollRef.current && !isUserScrollingRef.current) {
      const timeoutId = setTimeout(() => {
        if (flatListRef.current && shouldAutoScrollRef.current && !isUserScrollingRef.current) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('newOrderChatMessage', (newMessage: OrderChatMessage & { orderId?: string }) => {
      if (newMessage.orderId && newMessage.orderId !== order._id) {
        return;
      }
      setMessages(prevMessages => {
        const exists = prevMessages.some(
          msg => msg._id === newMessage._id ||
          (msg.text === newMessage.text && msg.timestamp === newMessage.timestamp)
        );
        if (exists) {
          return prevMessages;
        }
        const updated = [...prevMessages, newMessage];
        setTimeout(() => {
          if (flatListRef.current && shouldAutoScrollRef.current && !isUserScrollingRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
        return updated;
      });
    });

    return () => {
      subscription.remove();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [order._id]);

  const handleTouchEnd = () => {
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
    <SafeAreaView style={styles.safeArea} edges={androidOnlySafeAreaEdges}>
      <Back navigation={navigation} title="Чат с курьером" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <View style={styles.touchableArea} />
        </TouchableWithoutFeedback>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyContent
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          onScrollBeginDrag={() => {
            isUserScrollingRef.current = true;
            shouldAutoScrollRef.current = false;
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
              <Text style={styles.emptySubtext}>Начните разговор с курьером</Text>
            </View>
          }
        />

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
              !inputText.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
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
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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

export default CourierChatScreen;
