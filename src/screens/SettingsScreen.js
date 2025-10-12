import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import useAuth from '../hooks/useAuth';
import config from '../config/config';
import { registerPushToken } from '../services/pushTokenService';

/**
 * SettingsScreen Component
 *
 * Shows app settings including push notification permissions
 * and allows user to manage their notification preferences
 */
const SettingsScreen = () => {
  const { isLoggedIn, userId, userToken, pushTokenEndpoint } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check current permission status
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      if (config.DEBUG) {
        console.log('[Settings] Permission status:', status);
      }
    } catch (error) {
      console.error('[Settings] Error checking permissions:', error);
    }
  };

  /**
   * Request notification permissions
   */
  const handleRequestPermissions = async () => {
    try {
      setIsLoading(true);

      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        Alert.alert(
          'Permisos concedidos',
          'Las notificaciones están activadas. Ahora puedes recibir avisos.',
          [
            {
              text: 'Registrar en servidor',
              onPress: handleRegisterToken
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert(
          'Permisos denegados',
          'No podrás recibir notificaciones. Puedes cambiar esto en Ajustes.',
          [
            {
              text: 'Abrir Ajustes',
              onPress: () => Linking.openSettings()
            },
            {
              text: 'Cancelar',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('[Settings] Error requesting permissions:', error);
      Alert.alert('Error', 'No se pudieron solicitar los permisos');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register push token with backend
   */
  const handleRegisterToken = async () => {
    if (!isLoggedIn) {
      Alert.alert('No autenticado', 'Debes iniciar sesión primero');
      return;
    }

    if (!pushTokenEndpoint) {
      Alert.alert(
        'Endpoint no configurado',
        'No se ha proporcionado el endpoint de registro. Inicia sesión de nuevo.'
      );
      return;
    }

    try {
      setIsLoading(true);

      const success = await registerPushToken(
        userId,
        userToken,
        pushTokenEndpoint
      );

      if (success) {
        Alert.alert('✅ Éxito', 'Token registrado correctamente en el servidor');
      } else {
        Alert.alert('⚠️ Error', 'No se pudo registrar el token con el servidor');
      }
    } catch (error) {
      console.error('[Settings] Error registering token:', error);
      Alert.alert('Error', 'Ocurrió un error al registrar el token');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open system settings
   */
  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  /**
   * Get permission status text and color
   */
  const getPermissionInfo = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          text: 'Activadas ✅',
          color: config.COLORS.SUCCESS,
          description: 'Puedes recibir notificaciones push'
        };
      case 'denied':
        return {
          text: 'Desactivadas ❌',
          color: config.COLORS.ERROR,
          description: 'Ve a Ajustes para activarlas'
        };
      case 'undetermined':
        return {
          text: 'No configuradas ⚠️',
          color: '#FF9500',
          description: 'Pulsa el botón para solicitar permisos'
        };
      default:
        return {
          text: 'Desconocido',
          color: config.COLORS.TEXT_SECONDARY,
          description: 'Verificando estado...'
        };
    }
  };

  const permissionInfo = getPermissionInfo();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Gestiona tus preferencias de la app</Text>
        </View>

        {/* Authentication Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de sesión</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Usuario:</Text>
              <Text style={styles.value}>
                {isLoggedIn ? 'Autenticado ✅' : 'No autenticado ❌'}
              </Text>
            </View>
            {isLoggedIn && userId && (
              <View style={styles.row}>
                <Text style={styles.label}>ID:</Text>
                <Text style={[styles.value, styles.mono]} numberOfLines={1}>
                  {userId.substring(0, 20)}...
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones Push</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Estado:</Text>
              <Text style={[styles.value, { color: permissionInfo.color }]}>
                {permissionInfo.text}
              </Text>
            </View>

            <Text style={styles.description}>
              {permissionInfo.description}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {permissionStatus === 'undetermined' && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleRequestPermissions}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Solicitando...' : 'Solicitar permisos'}
                  </Text>
                </TouchableOpacity>
              )}

              {permissionStatus === 'granted' && isLoggedIn && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonSuccess]}
                  onPress={handleRegisterToken}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Registrando...' : 'Registrar en servidor'}
                  </Text>
                </TouchableOpacity>
              )}

              {permissionStatus === 'denied' && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonWarning]}
                  onPress={handleOpenSettings}
                >
                  <Text style={styles.buttonText}>Abrir Ajustes del sistema</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={checkPermissionStatus}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Actualizar estado
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la app</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{config.APP_TITLE}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Versión:</Text>
              <Text style={styles.value}>{config.APP_VERSION}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Modo:</Text>
              <Text style={styles.value}>
                {config.DEBUG ? 'Desarrollo 🔧' : 'Producción 🚀'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: config.COLORS.BACKGROUND,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: config.COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: config.COLORS.TEXT_SECONDARY,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: config.COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: config.COLORS.TEXT_SECONDARY,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: config.COLORS.TEXT_PRIMARY,
    flex: 1,
    textAlign: 'right',
  },
  mono: {
    fontFamily: 'monospace',
  },
  description: {
    fontSize: 13,
    color: config.COLORS.TEXT_SECONDARY,
    marginBottom: 16,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: config.COLORS.PRIMARY,
  },
  buttonSuccess: {
    backgroundColor: config.COLORS.SUCCESS,
  },
  buttonWarning: {
    backgroundColor: '#FF9500',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: config.COLORS.PRIMARY,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: config.COLORS.PRIMARY,
  },
});

export default SettingsScreen;
