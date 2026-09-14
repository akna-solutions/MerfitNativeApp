import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { SettingsRow } from "../../../shared/profile/components/SettingsRow";
import { SettingsSection } from "../../../shared/profile/components/SettingsSection";
import { useTheme } from "../../../shared/theme/ThemeContext";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "MB FIT Puanı nasıl hesaplanır?",
    answer:
      "MB FIT Puanın; antrenman düzenliliği, tamamlama, ilerleme, beslenme ve seri (streak) verilerinden hesaplanır. Ayrıntıları Sıralama ekranında görebilirsin.",
  },
  {
    question: "MB FIT Plus nedir?",
    answer:
      "MB FIT Plus; gelişmiş analizler, yapay zeka destekli antrenman ve beslenme planları, kişisel analizler ve detaylı puan dökümünün kilidini açar.",
  },
  {
    question: "Antrenmanlar nasıl takip edilir?",
    answer:
      "Aktif Antrenman sırasında her set için ağırlık ve tekrar sayını gir - MB FIT setlerini, hacmini ve ilerlemeni otomatik olarak takip eder.",
  },
  {
    question: "Plus üyeliğimi nasıl iptal edebilirim?",
    answer:
      "MB FIT Plus üyeliğini görüntülemek ve istediğin zaman iptal etmek için Profil → Aboneliği Yönet bölümüne git.",
  },
  {
    question: "Sıralama (liderlik tablosu) nasıl çalışır?",
    answer:
      "MB FIT Puanına göre Türkiye'deki diğer MB FIT kullanıcılarıyla sıralanırsın. Profilini Gizlilik ayarlarından liderlik tablosunda gizleyebilirsin.",
  },
];

function sendMail(subject: string) {
  Linking.openURL(
    `mailto:support@mbfit.app?subject=${encodeURIComponent(subject)}`,
  ).catch(() => {});
}

export default function HelpRoute() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { colors } = useTheme();

  return (
    <ProfileDetailShell title="Yardım ve Destek">
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sıkça Sorulan Sorular</Text>
      <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = expanded === index;
          return (
            <View
              key={item.question}
              style={[
                styles.faqRow,
                { borderBottomColor: colors.border },
                index === FAQ_ITEMS.length - 1 && styles.faqRowLast,
              ]}
            >
              <Pressable
                onPress={() => setExpanded(isOpen ? null : index)}
                style={styles.faqHeader}
              >
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
              {isOpen ? (
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.answer}</Text>
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
            onPress={() => sendMail("MB FIT Destek Talebi")}
          />
          <SettingsRow
            icon="warning-outline"
            title="Sorun Bildir"
            onPress={() => sendMail("MB FIT Sorun Bildirimi")}
          />
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            title="Geri Bildirim Gönder"
            onPress={() => sendMail("MB FIT Geri Bildirim")}
            isLast
          />
        </SettingsSection>
      </View>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  faqCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  faqRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  faqRowLast: { borderBottomWidth: 0 },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  gapTop: { marginTop: 24 },
});
