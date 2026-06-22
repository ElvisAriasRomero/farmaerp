import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/constants/colors";

export default function RegisterScreen() {
  const { registrarCliente } = useAuth();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const onSubmit = async () => {
    if (!form.nombre || !form.email || !form.password) {
      setError("Nombre, correo y contraseña son obligatorios.");
      return;
    }
    if (form.password !== form.password_confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await registrarCliente(form);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Regístrate como cliente</Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Field
            label="Nombre completo *"
            placeholder="Ej. Juan Pérez"
            value={form.nombre}
            onChangeText={set("nombre")}
          />
          <Field
            label="Correo electrónico *"
            placeholder="tucorreo@ejemplo.com"
            value={form.email}
            onChangeText={set("email")}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Teléfono"
            placeholder="700-00000"
            value={form.telefono}
            onChangeText={set("telefono")}
            keyboardType="phone-pad"
          />
          <Field
            label="Dirección"
            placeholder="Calle / Zona"
            value={form.direccion}
            onChangeText={set("direccion")}
          />
          <Field
            label="Contraseña *"
            placeholder="••••••••"
            value={form.password}
            onChangeText={set("password")}
            secureTextEntry
          />
          <Field
            label="Confirmar contraseña *"
            placeholder="••••••••"
            value={form.password_confirm}
            onChangeText={set("password_confirm")}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Registrarme</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" style={styles.linkText}>
              Inicia sesión
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 18 },
  logoImg: { width: 210, height: 78, marginBottom: 4 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 8,
  },
  subtitle: { color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 22,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },
  error: {
    backgroundColor: "#FEE2E2",
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 6,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  footerText: { color: colors.textMuted },
  linkText: { color: colors.primary, fontWeight: "700" },
});
