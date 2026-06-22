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
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/constants/colors";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
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
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Tu farmacia en el bolsillo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passRow}>
            <TextInput
              style={styles.passInput}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass((s) => !s)}>
              <Ionicons
                name={showPass ? "eye-off" : "eye"}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <Link href="/(auth)/register" style={styles.linkText}>
              Regístrate
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logoWrap: { alignItems: "center", marginBottom: 28 },
  logoImg: { width: 240, height: 90 },
  tagline: { color: colors.textMuted, marginTop: 8 },
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  passRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  passInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  footerText: { color: colors.textMuted },
  linkText: { color: colors.primary, fontWeight: "700" },
});
