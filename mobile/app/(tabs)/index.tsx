import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProductos } from "../../src/hooks/useProductos";
import { useCart } from "../../src/context/CartContext";
import { productosApi } from "../../src/api/productos";
import ProductCard from "../../src/components/ProductCard";
import CategoryFilter from "../../src/components/CategoryFilter";
import EmptyState from "../../src/components/EmptyState";
import BarcodeScannerModal from "../../src/components/BarcodeScannerModal";
import { colors } from "../../src/constants/colors";

export default function CatalogoScreen() {
  const router = useRouter();
  const { addItem } = useCart();
  const {
    productos,
    categorias,
    search,
    setSearch,
    categoria,
    setCategoria,
    loading,
    refreshing,
    refrescar,
    error,
  } = useProductos();

  const [scannerOpen, setScannerOpen] = useState(false);

  const onScanned = async (codigo: string) => {
    setScannerOpen(false);
    try {
      const prod = await productosApi.porCodigoBarras(codigo);
      if (prod) {
        router.push(`/producto/${prod.id_producto}`);
      } else {
        Alert.alert("Sin resultados", `No se encontró el producto: ${codigo}`);
      }
    } catch {
      Alert.alert("Error", "No se pudo buscar el producto.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Barra de búsqueda + escáner */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => setScannerOpen(true)}
        >
          <Ionicons name="barcode-outline" size={24} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <CategoryFilter
        categorias={categorias}
        selected={categoria}
        onSelect={setCategoria}
      />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No se pudo cargar"
          subtitle={error}
        >
          <TouchableOpacity style={styles.retryBtn} onPress={refrescar}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </EmptyState>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => String(item.id_producto)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.list}
          onRefresh={refrescar}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ProductCard
                producto={item}
                onPress={() => router.push(`/producto/${item.id_producto}`)}
                onAdd={() => addItem(item, 1)}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Sin resultados"
              subtitle="Prueba con otra búsqueda o categoría."
            />
          }
        />
      )}

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={onScanned}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: colors.text },
  scanBtn: {
    backgroundColor: colors.primary,
    width: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 10, paddingBottom: 24 },
  columnWrap: { gap: 10 },
  cardWrap: { flex: 1, marginBottom: 10 },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: colors.textInverse, fontWeight: "700" },
});
