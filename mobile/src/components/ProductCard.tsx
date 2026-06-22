import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Producto } from "../types";
import { colors } from "../constants/colors";
import { formatMoney } from "../utils/format";
import { resolveMediaUrl } from "../config";

interface Props {
  producto: Producto;
  onPress: () => void;
  onAdd?: () => void;
}

export default function ProductCard({ producto, onPress, onAdd }: Props) {
  const img = resolveMediaUrl(producto.foto);
  const sinStock = producto.stock_actual <= 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imgWrap}>
        {img ? (
          <Image source={img} style={styles.img} contentFit="cover" transition={150} />
        ) : (
          <Ionicons name="medkit-outline" size={40} color={colors.textMuted} />
        )}
        {sinStock ? (
          <View style={styles.outBadge}>
            <Text style={styles.outBadgeText}>Sin stock</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.cat}>{producto.categoria_nombre}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {producto.nombre}
        </Text>
        <View style={styles.row}>
          <Text style={styles.price}>{formatMoney(producto.precio_venta)}</Text>
          {onAdd ? (
            <TouchableOpacity
              style={[styles.addBtn, sinStock && styles.addBtnDisabled]}
              onPress={onAdd}
              disabled={sinStock}
            >
              <Ionicons name="add" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  imgWrap: {
    height: 120,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: "100%", height: "100%" },
  outBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.danger,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  outBadgeText: { color: colors.textInverse, fontSize: 11, fontWeight: "700" },
  body: { padding: 10, gap: 2 },
  cat: { fontSize: 11, color: colors.accent, fontWeight: "600" },
  name: { fontSize: 14, fontWeight: "600", color: colors.text, minHeight: 38 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  price: { fontSize: 15, fontWeight: "800", color: colors.primary },
  addBtn: {
    backgroundColor: colors.accent,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: { backgroundColor: colors.border },
});
