import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAskChatbotMutation } from '../../services/aiApi';

interface Message {
  id: string;
  from: 'user' | 'bot';
  text: string;
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      from: 'bot',
      text: "Hi, I'm the TourX travel assistant. Ask me about itineraries, offline maps, safety, weather, or anything else about your trip.",
    },
  ]);
  const [input, setInput] = useState('');
  const [askChatbot, { isLoading }] = useAskChatbotMutation();
  const listRef = useRef<FlatList>(null);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: `u-${Date.now()}`, from: 'user', text };
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: (m.from === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', text: m.text }));
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const res = await askChatbot({ message: text, history }).unwrap();
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, from: 'bot', text: res.reply }]);
    } catch (err: any) {
      const message =
        err?.data?.message ||
        "Sorry, I couldn't reach the assistant. Try again.";
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, from: 'bot', text: message }]);
    } finally {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.botBubble]}>
              <Text style={item.from === 'user' ? styles.userText : styles.botText}>{item.text}</Text>
            </View>
          )}
        />
        {isLoading ? <Text style={styles.typing}>Assistant is typing...</Text> : null}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your trip..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable onPress={send} style={styles.sendButton}>
            <Ionicons name="send" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.sm },
  bubble: { maxWidth: '80%', padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.sm },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  botBubble: { backgroundColor: colors.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  userText: { color: colors.textInverse, ...typography.body },
  botText: { color: colors.text, ...typography.body },
  typing: { ...typography.caption, color: colors.textMuted, paddingHorizontal: spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface, color: colors.text },
  sendButton: { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
