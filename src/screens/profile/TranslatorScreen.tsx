import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { TRANSLATE_LANGUAGES } from '../../constants/translateLanguages';
import { useTranslateTextMutation } from '../../services/aiApi';

const QUICK_PHRASES = ['Hello, how are you?', 'Thank you very much', 'How much does this cost?', 'Where is the nearest hospital?', 'I need help'];

export default function TranslatorScreen() {
  const [text, setText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Sinhala');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [translate, { data: result, isLoading, error }] = useTranslateTextMutation();

  const filteredLanguages = useMemo(
    () => TRANSLATE_LANGUAGES.filter((l) => l.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const handleTranslate = (input?: string) => {
    const value = (input ?? text).trim();
    if (!value) return;
    translate({ text: value, targetLanguage });
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>AI Translator</Text>
      <Text style={styles.subtitle}>
        Powered by Claude — detects your language automatically and translates into any of 100+
        languages.
      </Text>

      <TextField
        label="Text to translate"
        value={text}
        onChangeText={setText}
        placeholder="Type a phrase in any language..."
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <Text style={styles.label}>Translate to</Text>
      <Pressable style={styles.languageButton} onPress={() => setPickerOpen(true)}>
        <Ionicons name="language" size={18} color={colors.primary} />
        <Text style={styles.languageButtonText}>{targetLanguage}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <Button label="Translate" onPress={() => handleTranslate()} loading={isLoading} style={{ marginTop: spacing.md }} />
      {error ? (
        <Text style={styles.errorText}>
          {(error as any)?.data?.message || 'Could not translate. Please try again.'}
        </Text>
      ) : null}

      <Text style={[styles.label, { marginTop: spacing.md }]}>Quick phrases</Text>
      <View style={styles.quickRow}>
        {QUICK_PHRASES.map((phrase) => (
          <Pressable
            key={phrase}
            style={styles.quickChip}
            onPress={() => {
              setText(phrase);
              handleTranslate(phrase);
            }}
          >
            <Text style={styles.quickChipText}>{phrase}</Text>
          </Pressable>
        ))}
      </View>

      {result ? (
        <Card style={styles.resultCard}>
          <Text style={styles.detectedText}>Detected: {result.detectedSourceLangName}</Text>
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

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose a language</Text>
            <Pressable onPress={() => setPickerOpen(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <TextField label="" placeholder="Search languages..." value={search} onChangeText={setSearch} />
          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={styles.languageRow}
                onPress={() => {
                  setTargetLanguage(item);
                  setPickerOpen(false);
                  setSearch('');
                }}
              >
                <Text style={styles.languageRowText}>{item}</Text>
                {item === targetLanguage ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginVertical: spacing.sm },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  languageButtonText: { ...typography.body, color: colors.text, flex: 1 },
  errorText: { color: colors.danger, marginTop: spacing.sm },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickChipText: { ...typography.caption, color: colors.text },
  resultCard: { marginTop: spacing.lg },
  detectedText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  resultOriginal: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  resultTranslated: { ...typography.h2, color: colors.text, marginTop: spacing.xs },
  modalContainer: { flex: 1, backgroundColor: colors.background, padding: spacing.md, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h2, color: colors.text },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  languageRowText: { ...typography.body, color: colors.text },
});
