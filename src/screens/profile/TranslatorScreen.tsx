import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import { useTranslateTextMutation } from '../../services/aiApi';

const LANGUAGES = [
  { code: 'si', label: 'Sinhala' },
  { code: 'ta', label: 'Tamil' },
];

const QUICK_PHRASES = ['hello', 'thank you', 'how much', 'where is', 'help', 'good morning'];

export default function TranslatorScreen() {
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('si');
  const [translate, { data: result, isLoading }] = useTranslateTextMutation();

  const handleTranslate = (input?: string) => {
    const value = input ?? text;
    if (!value.trim()) return;
    translate({ text: value, targetLang });
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>AI Translator</Text>
      <Text style={styles.subtitle}>
        Real-time phrase translation to help you communicate with locals. Simulates the proposal's
        translation API with a curated phrasebook.
      </Text>

      <Text style={styles.label}>Translate to</Text>
      <ChipSelector
        options={LANGUAGES.map((l) => l.label)}
        selected={[LANGUAGES.find((l) => l.code === targetLang)?.label ?? '']}
        onToggle={(label) => setTargetLang(LANGUAGES.find((l) => l.label === label)?.code ?? 'si')}
      />

      <TextField
        label="Phrase"
        value={text}
        onChangeText={setText}
        placeholder="Type a phrase in English..."
        style={{ marginTop: spacing.md }}
      />
      <Button label="Translate" onPress={() => handleTranslate()} loading={isLoading} />

      <Text style={[styles.label, { marginTop: spacing.md }]}>Quick phrases</Text>
      <ChipSelector
        options={QUICK_PHRASES}
        selected={[]}
        onToggle={(phrase) => {
          setText(phrase);
          handleTranslate(phrase);
        }}
      />

      {result ? (
        <Card style={styles.resultCard}>
          <Text style={styles.resultOriginal}>{result.original}</Text>
          <Text style={styles.resultTranslated}>{result.translated}</Text>
          <Button
            label="Speak"
            variant="outline"
            icon={<Ionicons name="volume-high" size={16} color={colors.primary} />}
            onPress={() => Speech.speak(result.translated)}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginVertical: spacing.sm },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  resultCard: { marginTop: spacing.lg },
  resultOriginal: { ...typography.caption, color: colors.textMuted },
  resultTranslated: { ...typography.h2, color: colors.primaryDark, marginTop: spacing.xs },
});
