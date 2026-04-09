import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import Colors from '../../constants/Colors';
import i18n from '../../i18n';

export default function PerfilScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [correo, setCorreo] = useState('');
  const [edad, setEdad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    if (user) {
      setCorreo(user.correo || '');
      setEdad(user.edad != null ? user.edad.toString() : '');
      setTelefono(user.telefono != null ? user.telefono.toString() : '');
      setDescripcion(user.descripcion || '');
    }
  }, [user]);

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    try {
      const response = await api.updateUsuario(user.id, {
        correo: correo.trim() || undefined,
        edad: edad ? parseInt(edad, 10) : undefined,
        telefono: telefono ? parseInt(telefono, 10) : undefined,
        descripcion: descripcion.trim() || undefined,
      });
      updateUser(response.data);
      setEditing(false);
      Alert.alert(i18n.t('perfil.profileUpdated'), i18n.t('perfil.profileUpdatedMsg'));
    } catch (error: any) {
      Alert.alert(i18n.t('common.error'), error.message || i18n.t('perfil.updateError'));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (user) {
      setCorreo(user.correo || '');
      setEdad(user.edad != null ? user.edad.toString() : '');
      setTelefono(user.telefono != null ? user.telefono.toString() : '');
      setDescripcion(user.descripcion || '');
    }
    setEditing(false);
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm(i18n.t('perfil.logoutConfirm'))) {
        logout();
      }
    } else {
      Alert.alert(
        i18n.t('perfil.logout'),
        i18n.t('perfil.logoutConfirm'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          { text: i18n.t('perfil.logout'), style: 'destructive', onPress: logout },
        ]
      );
    }
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.headerSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color={Colors.white} />
            </View>
            <Text style={styles.userName}>{user.nombre}</Text>
            <Text style={styles.userUsername}>@{user.username}</Text>
            {!editing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
                <Text style={styles.editButtonText}>{i18n.t('perfil.editProfile')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Fields */}
          <View style={styles.fieldsSection}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{i18n.t('perfil.email')}</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={correo}
                    onChangeText={setCorreo}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder={i18n.t('perfil.emailPlaceholder')}
                    placeholderTextColor={Colors.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {user.correo || i18n.t('perfil.notSpecified')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.fieldRow}>
              <View style={styles.fieldIconContainer}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{i18n.t('perfil.age')}</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={edad}
                    onChangeText={setEdad}
                    keyboardType="numeric"
                    placeholder={i18n.t('perfil.agePlaceholder')}
                    placeholderTextColor={Colors.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {user.edad != null ? `${user.edad} ${i18n.t('common.years')}` : i18n.t('perfil.ageNotSpecified')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.fieldRow}>
              <View style={styles.fieldIconContainer}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{i18n.t('perfil.phone')}</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={telefono}
                    onChangeText={setTelefono}
                    keyboardType="numeric"
                    placeholder={i18n.t('perfil.phonePlaceholder')}
                    placeholderTextColor={Colors.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {user.telefono != null ? user.telefono.toString() : i18n.t('perfil.notSpecified')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.fieldRow}>
              <View style={styles.fieldIconContainer}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{i18n.t('perfil.description')}</Text>
                {editing ? (
                  <TextInput
                    style={[styles.fieldInput, styles.textArea]}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    numberOfLines={3}
                    placeholder={i18n.t('perfil.descriptionPlaceholder')}
                    placeholderTextColor={Colors.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {user.descripcion || i18n.t('perfil.noDescription')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {editing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelActionButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelActionText}>{i18n.t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>{i18n.t('perfil.saveChanges')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>{i18n.t('perfil.logout')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  userUsername: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  fieldsSection: {
    backgroundColor: Colors.card,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  fieldIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 15,
    color: Colors.text,
  },
  fieldInput: {
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    gap: 12,
  },
  cancelActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.danger,
    fontWeight: '600',
    marginLeft: 8,
  },
});
