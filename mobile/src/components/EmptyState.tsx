import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function EmptyState({
  icon = "cube-outline",
  title,
  subtitle,
  children,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={56} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginTop: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  actions: { marginTop: 12 },
});
