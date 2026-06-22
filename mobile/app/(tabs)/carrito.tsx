import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCart } from "../../src/context/CartContext";
import CartItem from "../../src/components/CartItem";
import EmptyState from "../../src/components/EmptyState";
import { colors } from "../../src/constants/colors";
import { formatMoney } from "../../src/utils/format";

export default function CarritoScreen() {
  const router = useRouter();
  const { items, total, count, addItem, updateQty, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        icon="cart-outline"
        title="Tu carrito está vacío"
        subtitle="Agrega productos desde el catálogo."
      >
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.shopBtnText}>Ir al catálogo</Text>
        </TouchableOpacity>
      </EmptyState>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.producto.id_producto)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onInc={() =>
              updateQty(item.producto.id_producto, item.cantidad + 1)
            }
            onDec={() =>
              updateQty(item.producto.id_producto, item.cantidad - 1)
            }
            onRemove={() => removeItem(item.producto.id_producto)}
          />
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total ({count} ítems)</Text>
          <Text style={styles.totalValue}>{formatMoney(total)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push("/checkout")}
        >
          <Ionicons name="bag-check" size={20} color={colors.textInverse} />
          <Text style={styles.checkoutText}>Confirmar pedido</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 14 },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: { color: colors.textMuted, fontSize: 14 },
  totalValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 12,
  },
  checkoutText: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },
  shopBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shopBtnText: { color: colors.textInverse, fontWeight: "700" },
});
