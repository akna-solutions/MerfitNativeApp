import { Ionicons } from "@expo/vector-icons";
import { forwardRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { colors } from "../theme";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const WorkoutSearch = forwardRef<TextInput, Props>(
  function WorkoutSearch({ value, onChange }, ref) {
    return (
      <View style={styles.wrapper}>
        <Ionicons name="search-outline" size={17} color={colors.textMuted} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          placeholder="Antrenman ara..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardAppearance="dark"
          returnKeyType="search"
          style={styles.input}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
  },
});
