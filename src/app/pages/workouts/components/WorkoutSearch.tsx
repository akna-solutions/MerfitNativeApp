import { Ionicons } from "@expo/vector-icons";
import { forwardRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const WorkoutSearch = forwardRef<TextInput, Props>(
  function WorkoutSearch({ value, onChange }, ref) {
    const { colors, isDark } = useTheme();
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={17} color={colors.textSecondary} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          placeholder="Antrenman ara..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardAppearance={isDark ? "dark" : "light"}
          returnKeyType="search"
          style={[styles.input, { color: colors.text }]}
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
  },
});
