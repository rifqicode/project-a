import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';

interface SettingsState {
  language: string;
  minimumStockAlert: number;
  transactionIdFormat: string;
  enableStockAlert: boolean;
  enablePinSecurity: boolean;
  pin: string;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsState>({
    language: 'English',
    minimumStockAlert: 10,
    transactionIdFormat: 'TXN-YYYYMMDD-000',
    enableStockAlert: true,
    enablePinSecurity: false,
    pin: ''
  });

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showStockAlertModal, setShowStockAlertModal] = useState(false);
  const [showTransactionFormatModal, setShowTransactionFormatModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Bahasa Indonesia' },
  ];

  const transactionFormats = [
    'TXN-YYYYMMDD-000',
    'TR-YYMMDD-000',
    'TRANS-YYYY-MM-DD-000',
    'T-YYYYMMDD000',
    'Custom Format'
  ];

  const appVersion = '1.0.0';
  const buildNumber = '2025.10.22';

  const handleLanguageSelect = (language: string) => {
    setSettings(prev => ({ ...prev, language }));
    setShowLanguageModal(false);
    Alert.alert('Success', `Language changed to ${language}`);
  };

  const handleStockAlertSave = (value: string) => {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({ ...prev, minimumStockAlert: numValue }));
    setShowStockAlertModal(false);
    Alert.alert('Success', `Minimum stock alert set to ${numValue}`);
  };

  const handleTransactionFormatSave = (format: string) => {
    setSettings(prev => ({ ...prev, transactionIdFormat: format }));
    setShowTransactionFormatModal(false);
    Alert.alert('Success', 'Transaction ID format updated');
  };

  const handlePinSave = (pin: string) => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }
    setSettings(prev => ({ ...prev, pin, enablePinSecurity: true }));
    setShowPinModal(false);
    Alert.alert('Success', 'PIN security enabled');
  };

  const handleBackupData = () => {
    setShowBackupModal(false);
    Alert.alert('Success', 'Data backup completed successfully!');
  };

  const toggleStockAlert = (value: boolean) => {
    setSettings(prev => ({ ...prev, enableStockAlert: value }));
  };

  const togglePinSecurity = (value: boolean) => {
    if (value && !settings.pin) {
      setShowPinModal(true);
      return;
    }
    setSettings(prev => ({ ...prev, enablePinSecurity: value }));
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <Pressable style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <IconSymbol name={icon} size={20} color="#3b82f6" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent || (
          <>
            {value && <Text style={styles.settingValue}>{value}</Text>}
            {showArrow && <IconSymbol name="chevron.right" size={16} color="#9ca3af" />}
          </>
        )}
      </View>
    </Pressable>
  );

  const ModalContainer = ({ 
    visible, 
    title, 
    onClose, 
    children 
  }: {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" size={24} color="#6b7280" />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );

  return (
    <ParallaxScrollView>
      <ThemedView style={{
        ...styles.container,
      }}>
        <Header title="Settings" subtitle="Configure your app preferences" />
        <View style={{
          marginBottom: 50
        }}>
          {/* General Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>

            <SettingItem
              icon="globe"
              title="Language"
              subtitle="Choose your preferred language"
              value={settings.language}
              onPress={() => setShowLanguageModal(true)}
            />

            <SettingItem
              icon="bell.badge"
              title="Minimum Stock Alert"
              subtitle="Get notified when stock is low"
              value={`${settings.minimumStockAlert} units`}
              onPress={() => setShowStockAlertModal(true)}
            />

            <SettingItem
              icon="bell"
              title="Enable Stock Alerts"
              subtitle="Turn on/off low stock notifications"
              showArrow={false}
              rightComponent={
                <Switch
                  value={settings.enableStockAlert}
                  onValueChange={toggleStockAlert}
                  trackColor={{ false: '#f3f4f6', true: '#dbeafe' }}
                  thumbColor={settings.enableStockAlert ? '#3b82f6' : '#9ca3af'}
                />
              }
            />
          </View>

          {/* Transaction Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction</Text>

            <SettingItem
              icon="number"
              title="Transaction ID Format"
              subtitle="Customize transaction ID pattern"
              value={settings.transactionIdFormat}
              onPress={() => setShowTransactionFormatModal(true)}
            />
          </View>

          {/* Security Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <SettingItem
              icon="lock"
              title="PIN Security"
              subtitle="Secure app with 4-digit PIN"
              showArrow={false}
              rightComponent={
                <Switch
                  value={settings.enablePinSecurity}
                  onValueChange={togglePinSecurity}
                  trackColor={{ false: '#f3f4f6', true: '#dbeafe' }}
                  thumbColor={settings.enablePinSecurity ? '#3b82f6' : '#9ca3af'}
                />
              }
            />

            {settings.enablePinSecurity && (
              <SettingItem
                icon="key"
                title="Change PIN"
                subtitle="Update your security PIN"
                onPress={() => setShowPinModal(true)}
              />
            )}
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>

            <SettingItem
              icon="externaldrive"
              title="Backup Data"
              subtitle="Export your data for safekeeping"
              onPress={() => setShowBackupModal(true)}
            />
          </View>

          {/* App Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

            <SettingItem
              icon="info.circle"
              title="App Version"
              subtitle={`Build ${buildNumber}`}
              value={`v${appVersion}`}
              showArrow={false}
            />
          </View>
        </View>

        {/* Language Modal */}
        <ModalContainer
          visible={showLanguageModal}
          title="Select Language"
          onClose={() => setShowLanguageModal(false)}
        >
          <ScrollView style={styles.modalList}>
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.modalItem,
                  settings.language === lang.name && styles.selectedItem
                ]}
                onPress={() => handleLanguageSelect(lang.name)}
              >
                <Text style={[
                  styles.modalItemText,
                  settings.language === lang.name && styles.selectedText
                ]}>
                  {lang.name}
                </Text>
                {settings.language === lang.name && (
                  <IconSymbol name="checkmark" size={20} color="#3b82f6" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </ModalContainer>

        {/* Stock Alert Modal */}
        <ModalContainer
          visible={showStockAlertModal}
          title="Minimum Stock Alert"
          onClose={() => setShowStockAlertModal(false)}
        >
          <View style={styles.modalForm}>
            <Text style={styles.inputLabel}>Alert when stock is below:</Text>
            <TextInput
              style={styles.textInput}
              value={settings.minimumStockAlert.toString()}
              onChangeText={(text) => setSettings(prev => ({ 
                ...prev, 
                minimumStockAlert: parseInt(text) || 0 
              }))}
              keyboardType="numeric"
              placeholder="Enter minimum stock level"
            />
            <View style={styles.modalActions}>
              <Pressable 
                style={styles.cancelButton} 
                onPress={() => setShowStockAlertModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={styles.saveButton} 
                onPress={() => handleStockAlertSave(settings.minimumStockAlert.toString())}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </ModalContainer>

        {/* Transaction Format Modal */}
        <ModalContainer
          visible={showTransactionFormatModal}
          title="Transaction ID Format"
          onClose={() => setShowTransactionFormatModal(false)}
        >
          <ScrollView style={styles.modalList}>
            {transactionFormats.map((format) => (
              <Pressable
                key={format}
                style={[
                  styles.modalItem,
                  settings.transactionIdFormat === format && styles.selectedItem
                ]}
                onPress={() => handleTransactionFormatSave(format)}
              >
                <View style={styles.formatItem}>
                  <Text style={[
                    styles.modalItemText,
                    settings.transactionIdFormat === format && styles.selectedText
                  ]}>
                    {format}
                  </Text>
                  <Text style={styles.formatExample}>
                    Example: {format === 'TXN-YYYYMMDD-000' ? 'TXN-20251022-001' :
                            format === 'TR-YYMMDD-000' ? 'TR-251022-001' :
                            format === 'TRANS-YYYY-MM-DD-000' ? 'TRANS-2025-10-22-001' :
                            format === 'T-YYYYMMDD000' ? 'T-20251022001' :
                            'Custom format'}
                  </Text>
                </View>
                {settings.transactionIdFormat === format && (
                  <IconSymbol name="checkmark" size={20} color="#3b82f6" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </ModalContainer>

        {/* PIN Modal */}
        <ModalContainer
          visible={showPinModal}
          title="Set PIN"
          onClose={() => setShowPinModal(false)}
        >
          <View style={styles.modalForm}>
            <Text style={styles.inputLabel}>Enter 4-digit PIN:</Text>
            <TextInput
              style={styles.textInput}
              value={settings.pin}
              onChangeText={(text) => setSettings(prev => ({ ...prev, pin: text }))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="Enter PIN"
            />
            <View style={styles.modalActions}>
              <Pressable 
                style={styles.cancelButton} 
                onPress={() => setShowPinModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={styles.saveButton} 
                onPress={() => handlePinSave(settings.pin)}
              >
                <Text style={styles.saveButtonText}>Save PIN</Text>
              </Pressable>
            </View>
          </View>
        </ModalContainer>

        {/* Backup Modal */}
        <ModalContainer
          visible={showBackupModal}
          title="Backup Data"
          onClose={() => setShowBackupModal(false)}
        >
          <View style={styles.modalForm}>
            <View style={styles.backupInfo}>
              <IconSymbol name="externaldrive" size={48} color="#3b82f6" />
              <Text style={styles.backupTitle}>Export Your Data</Text>
              <Text style={styles.backupSubtitle}>
                This will create a backup file containing all your inventory data, 
                transactions, and settings.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable 
                style={styles.cancelButton} 
                onPress={() => setShowBackupModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={styles.saveButton} 
                onPress={handleBackupData}
              >
                <Text style={styles.saveButtonText}>Create Backup</Text>
              </Pressable>
            </View>
          </View>
        </ModalContainer>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    marginTop: 16
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedItem: {
    backgroundColor: '#eff6ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  formatItem: {
    flex: 1,
  },
  formatExample: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalForm: {
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  backupInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  backupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  backupSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});