import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Back } from '../components';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  isRead?: boolean;
}

const ChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Бутыль сломан, что делать?',
      isUser: true,
      timestamp: '09:40',
      isRead: true,
    },
    {
      id: '2',
      text: 'Добрый день! Напишите ваш номер заказа',
      isUser: false,
      timestamp: '09:40',
    },
    {
      id: '3',
      text: 'Заказ 122',
      isUser: true,
      timestamp: '09:41',
      isRead: true,
    },
    {
      id: '4',
      text: 'Минутку, уточняем информацию',
      isUser: false,
      timestamp: '09:41',
    },
  ]);

  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: false,
      };

      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  const renderMessage = (message: Message) => {
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessageContainer : styles.supportMessageContainer,
        ]}
      >
        {/* Аватарка поддержки */}
        {!message.isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>🌲</Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
        )}

        <View style={styles.messageContent}>
          {/* Имя отправителя */}
          {!message.isUser && (
            <Text style={styles.senderName}>Поддержка</Text>
          )}

          {/* Пузырь с сообщением */}
          <View
            style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.supportBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.supportMessageText,
              ]}
            >
              {message.text}
            </Text>
          </View>

          {/* Время и статус */}
          <View style={styles.messageInfo}>
            <Text style={styles.timestamp}>{message.timestamp}</Text>
            {message.isUser && (
              <Text style={[styles.readStatus, message.isRead && styles.readStatusRead]}>
                ✓✓
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="Чат поддержка" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Список сообщений */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Поле ввода */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Text style={styles.smileyIcon}>😊</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Напишите что-то..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={styles.attachButton}>
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.sendButton}
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
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  supportMessageContainer: {
    justifyContent: 'flex-start',
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
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#DC1818',
    alignSelf: 'flex-end',
  },
  supportBubble: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  supportMessageText: {
    color: '#333',
  },
  messageInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  readStatus: {
    fontSize: 12,
    color: '#999',
  },
  readStatusRead: {
    color: '#DC1818',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  smileyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  attachButton: {
    marginLeft: 8,
  },
  attachIcon: {
    fontSize: 18,
    color: '#999',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC1818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ChatScreen;