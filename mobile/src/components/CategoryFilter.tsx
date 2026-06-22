import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import type { Categoria } from "../types";
import { colors } from "../constants/colors";

interface Props {
  categorias: Categoria[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

export default function CategoryFilter({
  categorias,
  selected,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      <Chip
        label="Todas"
        active={selected === null}
        onPress={() => onSelect(null)}
      />
      {categorias.map((c) => (
        <Chip
          key={c.id_categoria}
          label={c.nombre}
          active={selected === c.id_categoria}
          onPress={() => onSelect(c.id_categoria)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: {
    paddingHorizontal: 14,
    gap: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.textInverse },
});
