import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../src/constants/colors";
import { useCart } from "../../src/context/CartContext";

function CartIcon({ color, size }: { color: string; size: number }) {
  const { count } = useCart();
  return (
    <View>
      <Ionicons name="cart" size={size} color={color} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Catálogo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: "Carrito",
          tabBarIcon: ({ color, size }) => (
            <CartIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Mis Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.textInverse, fontSize: 10, fontWeight: "700" },
});
