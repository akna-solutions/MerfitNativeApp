import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  testID?: string;
  onSubmit?: () => void;
};

export function SearchBar({ value, onChangeText, placeholder = "Ürün veya marka ara", testID = "store-search", onSubmit }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <Ionicons name="search-outline" size={18} color={colors.icon} />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Ürün ara"
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Aramayı temizle" testID={`${testID}-clear`}>
          <Ionicons name="close-circle" size={18} color={colors.icon} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 12, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, fontSize: 14, paddingVertical: 0 },
});
