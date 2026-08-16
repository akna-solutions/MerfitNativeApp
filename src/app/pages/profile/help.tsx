import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { SettingsRow } from "../../../shared/profile/components/SettingsRow";
import { SettingsSection } from "../../../shared/profile/components/SettingsSection";
import { colors } from "./theme";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "How does MERFIT Score work?",
    answer:
      "Your MERFIT Score is calculated from workout consistency, completion, progress, nutrition and streaks. See the breakdown on your Ranking screen.",
  },
  {
    question: "What is MERFIT Plus?",
    answer:
      "MERFIT Plus unlocks advanced analytics, AI workout and nutrition plans, personal insights and detailed score breakdowns.",
  },
  {
    question: "How are workouts tracked?",
    answer:
      "Log your weight and reps for each set during an Active Workout session - MERFIT tracks your sets, volume and progress automatically.",
  },
  {
    question: "How can I cancel Plus?",
    answer:
      "Go to Profile → Manage Subscription to view and cancel your MERFIT Plus membership at any time.",
  },
  {
    question: "How does the leaderboard work?",
    answer:
      "You're ranked against other MERFIT users in Türkiye based on your MERFIT Score. You can hide your profile from the leaderboard in Privacy settings.",
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
    <ProfileDetailShell title="Help & Support">
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
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
            title="Contact Support"
            onPress={() => sendMail("MERFIT Support Request")}
          />
          <SettingsRow
            icon="warning-outline"
            title="Report a Problem"
            onPress={() => sendMail("MERFIT Problem Report")}
          />
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            title="Send Feedback"
            onPress={() => sendMail("MERFIT Feedback")}
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
