import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Theme & Mock Data
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from './src/constants/theme';
import {
  INITIAL_OFFICER,
  INITIAL_ALERTS,
  INITIAL_CASES,
  INITIAL_MESSAGES,
  AlertItem,
  CaseItem,
  MessageItem,
  OfficerProfile,
} from './src/utils/mockState';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { AlertDetailsScreen } from './src/screens/AlertDetailsScreen';
import { CasesScreen } from './src/screens/CasesScreen';
import { LogsScreen } from './src/screens/LogsScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

type ScreenType = 'alerts' | 'details' | 'cases' | 'logs' | 'map' | 'profile';

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('alerts');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  // Live state tracking
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [cases, setCases] = useState<CaseItem[]>(INITIAL_CASES);
  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MESSAGES);
  const [officer, setOfficer] = useState<OfficerProfile>(INITIAL_OFFICER);

  // Authentication Callbacks
  const handleLoginSuccess = () => {
    setIsAuthorized(true);
    setCurrentScreen('alerts');
  };

  const handleLogout = () => {
    Alert.alert(
      'TERMINATE SESSION',
      'Are you sure you want to log out of the tactical command terminal?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'LOGOUT',
          style: 'destructive',
          onPress: () => {
            setIsAuthorized(false);
            setCurrentScreen('alerts');
            setSelectedAlert(null);
          },
        },
      ]
    );
  };

  // State update callbacks
  const handleSelectAlert = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setCurrentScreen('details');
  };

  const handleRespondAlert = (alertId: string) => {
    // Proactively update status to 'INVESTIGATING'
    setAlerts((prevAlerts) =>
      prevAlerts.map((a) => (a.id === alertId ? { ...a, status: 'INVESTIGATING' } : a))
    );

    const targetAlert = alerts.find((a) => a.id === alertId);
    if (targetAlert) {
      setSelectedAlert({ ...targetAlert, status: 'INVESTIGATING' });
      setCurrentScreen('details');
    }
  };

  const handleUpdateAlertStatus = (alertId: string, status: AlertItem['status']) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((a) => (a.id === alertId ? { ...a, status } : a))
    );
    // Also update selected alert state
    setSelectedAlert((prev) => (prev && prev.id === alertId ? { ...prev, status } : prev));
  };

  const handleUpdateOfficerStatus = (status: string) => {
    setOfficer((prev) => ({ ...prev, status }));
  };

  const handleSendMessage = (text: string) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: MessageItem = {
      id: `msg-user-${Date.now()}`,
      sender: 'PATROL UNIT-042',
      text,
      timestamp: timeString,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Simulated Dispatch HQ bidirectional transmission
    setTimeout(() => {
      const hqMsg: MessageItem = {
        id: `msg-hq-${Date.now()}`,
        sender: 'DISPATCH HQ',
        text: `Acknowledged, Patrol 042. Localized GPS tracking showing active bearing. Remain alert for target Vikram Singh at Sector 4.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, hqMsg]);
    }, 1800);
  };

  const handleSosTrigger = () => {
    Alert.alert(
      'EMERGENCY SOS ACTIVATED',
      'Tactical distress telemetry has been broadcast to command centers. Municipal patrol backups dispatched. Stay behind cover.',
      [{ text: 'STAND BY / ACKNOWLEDGE', style: 'destructive' }],
      { cancelable: false }
    );
  };

  // Nav back handler
  const handleBackToAlerts = () => {
    setCurrentScreen('alerts');
    setSelectedAlert(null);
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'alerts':
        return (
          <AlertsScreen
            alerts={alerts}
            onSelectAlert={handleSelectAlert}
            onRespondAlert={handleRespondAlert}
            onSosTrigger={handleSosTrigger}
          />
        );
      case 'details':
        return (
          <AlertDetailsScreen
            alert={selectedAlert!}
            onBack={handleBackToAlerts}
            onUpdateStatus={handleUpdateAlertStatus}
          />
        );
      case 'cases':
        return <CasesScreen cases={cases} />;
      case 'logs':
        return <LogsScreen alerts={alerts} onUpdateAlertStatus={handleUpdateAlertStatus} />;
      case 'map':
        return <MapScreen alerts={alerts} />;
      case 'profile':
        return (
          <ProfileScreen
            officer={officer}
            onLogout={handleLogout}
            onUpdateStatus={handleUpdateOfficerStatus}
          />
        );
      default:
        return <View style={styles.emptyContainer} />;
    }
  };

  if (!isAuthorized) {
    return (
      <SafeAreaProvider>
        <View style={styles.rootContainer}>
          <StatusBar style="light" />
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Render full application with top header and bottom tabs navigation
  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <StatusBar style="light" />
        
        {/* Active Screen Rendering */}
        <View style={styles.screenContainer}>{renderScreen()}</View>

        {/* Standardized Bottom Navigation Shell (hidden in details view) */}
        {currentScreen !== 'details' && (
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('alerts')}
            >
              <View style={[styles.navItemInner, currentScreen === 'alerts' && styles.navItemActive]}>
                <MaterialIcons
                  name="notifications-active"
                  size={22}
                  color={currentScreen === 'alerts' ? COLORS.primary : COLORS.onSurfaceVariant}
                  style={{ opacity: currentScreen === 'alerts' ? 1 : 0.6 }}
                />
                <Text style={[styles.navLabel, currentScreen === 'alerts' && styles.navLabelActive]}>ALERTS</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('cases')}
            >
              <View style={[styles.navItemInner, currentScreen === 'cases' && styles.navItemActive]}>
                <MaterialIcons
                  name="folder-shared"
                  size={22}
                  color={currentScreen === 'cases' ? COLORS.primary : COLORS.onSurfaceVariant}
                  style={{ opacity: currentScreen === 'cases' ? 1 : 0.6 }}
                />
                <Text style={[styles.navLabel, currentScreen === 'cases' && styles.navLabelActive]}>CASES</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('logs')}
            >
              <View style={[styles.navItemInner, currentScreen === 'logs' && styles.navItemActive]}>
                <MaterialIcons
                  name="history"
                  size={22}
                  color={currentScreen === 'logs' ? COLORS.primary : COLORS.onSurfaceVariant}
                  style={{ opacity: currentScreen === 'logs' ? 1 : 0.6 }}
                />
                <Text style={[styles.navLabel, currentScreen === 'logs' && styles.navLabelActive]}>LOGS</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('map')}
            >
              <View style={[styles.navItemInner, currentScreen === 'map' && styles.navItemActive]}>
                <MaterialIcons
                  name="explore"
                  size={22}
                  color={currentScreen === 'map' ? COLORS.primary : COLORS.onSurfaceVariant}
                  style={{ opacity: currentScreen === 'map' ? 1 : 0.6 }}
                />
                <Text style={[styles.navLabel, currentScreen === 'map' && styles.navLabelActive]}>MAP</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('profile')}
            >
              <View style={[styles.navItemInner, currentScreen === 'profile' && styles.navItemActive]}>
                <MaterialIcons
                  name="account-circle"
                  size={22}
                  color={currentScreen === 'profile' ? COLORS.primary : COLORS.onSurfaceVariant}
                  style={{ opacity: currentScreen === 'profile' ? 1 : 0.6 }}
                />
                <Text style={[styles.navLabel, currentScreen === 'profile' && styles.navLabelActive]}>PROFILE</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: 8,
    paddingBottom: 28, // High-fidelity clearance for modern rounded notch edges
    paddingHorizontal: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: ROUNDED.DEFAULT,
  },
  navItemActive: {
    backgroundColor: 'rgba(246, 190, 57, 0.12)',
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.6,
    textAlign: 'center',
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    marginTop: 3,
    fontWeight: '700',
  },
  navLabelActive: {
    color: COLORS.primary,
    opacity: 1,
  },
});
