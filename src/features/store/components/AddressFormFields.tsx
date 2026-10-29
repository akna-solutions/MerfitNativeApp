import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { AddressErrors, AddressForm } from "../utils/validation";

type Props = {
  value: AddressForm;
  errors: AddressErrors;
  onChange: (next: AddressForm) => void;
};

type FieldDef = { key: keyof AddressForm; label: string; placeholder: string; props?: TextInputProps; multiline?: boolean };

const FIELDS: FieldDef[] = [
  { key: "title", label: "Adres başlığı", placeholder: "Ev, İş…", props: { autoCapitalize: "words" } },
  { key: "fullName", label: "Ad soyad", placeholder: "Ad Soyad", props: { autoCapitalize: "words", textContentType: "name" } },
  { key: "phone", label: "Telefon", placeholder: "5XX XXX XX XX", props: { keyboardType: "phone-pad", textContentType: "telephoneNumber", maxLength: 17 } },
  { key: "city", label: "İl", placeholder: "İstanbul", props: { autoCapitalize: "words" } },
  { key: "district", label: "İlçe", placeholder: "Kadıköy", props: { autoCapitalize: "words" } },
  { key: "address", label: "Açık adres", placeholder: "Mahalle, cadde, sokak, bina ve daire no", multiline: true, props: { autoCapitalize: "sentences" } },
];

export function AddressFormFields({ value, errors, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {FIELDS.map((field) => {
        const error = errors[field.key];
        return (
          <View key={field.key} style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{field.label}</Text>
            <TextInput
              testID={`field-${field.key}`}
              value={value[field.key]}
              onChangeText={(text) => onChange({ ...value, [field.key]: text })}
              placeholder={field.placeholder}
              placeholderTextColor={colors.icon}
              multiline={field.multiline}
              accessibilityLabel={field.label}
              style={[
                styles.input,
                field.multiline && styles.multiline,
                { color: colors.text, backgroundColor: colors.inputBackground, borderColor: error ? colors.danger : colors.border },
              ]}
              {...field.props}
            />
            {error ? (
              <Text style={[styles.error, { color: colors.danger }]} testID={`error-${field.key}`} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  multiline: { minHeight: 84, paddingTop: 12, textAlignVertical: "top" },
  error: { fontSize: 12 },
});
