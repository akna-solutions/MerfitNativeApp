import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { SettingsRow } from "../../../shared/profile/components/SettingsRow";
import { SettingsSection } from "../../../shared/profile/components/SettingsSection";
import { colors } from "./theme";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "MERFIT Puanı nasıl hesaplanır?",
    answer:
      "MERFIT Puanın; antrenman düzenliliği, tamamlama, ilerleme, beslenme ve seri (streak) verilerinden hesaplanır. Ayrıntıları Sıralama ekranında görebilirsin.",
  },
  {
    question: "MERFIT Plus nedir?",
    answer:
      "MERFIT Plus; gelişmiş analizler, yapay zeka destekli antrenman ve beslenme planları, kişisel analizler ve detaylı puan dökümünün kilidini açar.",
  },
  {
    question: "Antrenmanlar nasıl takip edilir?",
    answer:
      "Aktif Antrenman sırasında her set için ağırlık ve tekrar sayını gir - MERFIT setlerini, hacmini ve ilerlemeni otomatik olarak takip eder.",
  },
  {
    question: "Plus üyeliğimi nasıl iptal edebilirim?",
    answer:
      "MERFIT Plus üyeliğini görüntülemek ve istediğin zaman iptal etmek için Profil → Aboneliği Yönet bölümüne git.",
  },
  {
    question: "Sıralama (liderlik tablosu) nasıl çalışır?",
    answer:
      "MERFIT Puanına göre Türkiye'deki diğer MERFIT kullanıcılarıyla sıralanırsın. Profilini Gizlilik ayarlarından liderlik tablosunda gizleyebilirsin.",
  },
];

function sendMail(subject: string) {
  Linking.openURL(
    `mailto:support@merfit.app?subject=${encodeURIComponent(subject)}`,
  ).catch(() => {});
}

export default function HelpRoute() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ProfileDetailShell title="Yardım ve Destek">
      <Text style={styles.sectionTitle}>Sıkça Sorulan Sorular</Text>
      <View style={styles.faqCard}>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = expanded === index;
          return (
            <View
              key={item.question}
              style={[
                styles.faqRow,
                index === FAQ_ITEMS.length - 1 && styles.faqRowLast,
              ]}
            >
              <Pressable
                onPress={() => setExpanded(isOpen ? null : index)}
                style={styles.faqHeader}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
              {isOpen ? (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.gapTop}>
        <SettingsSection>
          <SettingsRow
            icon="mail-outline"
            title="Destekle İletişime Geç"
            onPress={() => sendMail("MERFIT Destek Talebi")}
          />
          <SettingsRow
            icon="warning-outline"
            title="Sorun Bildir"
            onPress={() => sendMail("MERFIT Sorun Bildirimi")}
          />
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            title="Geri Bildirim Gönder"
            onPress={() => sendMail("MERFIT Geri Bildirim")}
            isLast
          />
        </SettingsSection>
      </View>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  faqCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  faqRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  faqRowLast: { borderBottomWidth: 0 },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQuestion: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  faqAnswer: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  gapTop: { marginTop: 24 },
});
