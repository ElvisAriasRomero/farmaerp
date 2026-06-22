import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { ventasApi } from "../../src/api/ventas";
import { apiErrorMessage } from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";
import OrderCard from "../../src/components/OrderCard";
import EmptyState from "../../src/components/EmptyState";
import { colors } from "../../src/constants/colors";
import type { Venta } from "../../src/types";

export default function PedidosScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const data = await ventasApi.historial();
      setVentas(data);
    } catch (e) {
      setError(apiErrorMessage(e, "No se pudo cargar el historial."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recargar al entrar a la pestaña.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const confirmarLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Cabecera de usuario */}
      <View style={styles.userBar}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={36} color={colors.primary} />
          <View>
            <Text style={styles.userName}>{user?.nombre ?? "Cliente"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={confirmarLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Error al cargar"
          subtitle={error}
        >
          <TouchableOpacity style={styles.retryBtn} onPress={cargar}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </EmptyState>
      ) : ventas.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Aún no tienes pedidos"
          subtitle="Tus compras aparecerán aquí."
        >
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.retryText}>Ir al catálogo</Text>
          </TouchableOpacity>
        </EmptyState>
      ) : (
        <FlatList
          data={ventas}
          keyExtractor={(v) => String(v.id_venta)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onRefresh={() => {
            setRefreshing(true);
            cargar();
          }}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <OrderCard
              venta={item}
              expanded={expanded === item.id_venta}
              onToggle={() =>
                setExpanded((cur) =>
                  cur === item.id_venta ? null : item.id_venta
                )
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  userBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  userName: { fontSize: 15, fontWeight: "700", color: colors.text },
  userEmail: { fontSize: 12, color: colors.textMuted },
  logoutBtn: { padding: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 14 },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: colors.textInverse, fontWeight: "700" },
});
