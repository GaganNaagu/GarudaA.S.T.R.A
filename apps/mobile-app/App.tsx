import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, Alert, BackHandler, ToastAndroid, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Theme & Mock Data
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from './src/constants/theme';
import {
  INITIAL_OFFICER,
  INITIAL_ALERTS,
  INITIAL_CASES,
  INITIAL_MESSAGES,
  INITIAL_AUDIT_LOGS,
  SIMULATED_DEMO_ALERT,
  AlertItem,
  CaseItem,
  MessageItem,
  OfficerProfile,
  AuditLogEntry,
} from './src/utils/mockState';

// Services — new persistent background layer
import * as DutyManager from './src/services/dutyManager';
import { checkAllPermissionsStatus, requestPermissionType } from './src/services/permissionService';

// Alert service — callbacks only (WebSocket is in socketManager now)
import {
  registerAlertCallbacks,
  unregisterAlertCallbacks,
  simulateIncomingAlert,
} from './src/utils/alertService';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { getResolvedBackendUrls } from './src/utils/networkConfig';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { AlertDetailsScreen } from './src/screens/AlertDetailsScreen';
import { CasesScreen } from './src/screens/CasesScreen';
import { LogsScreen } from './src/screens/LogsScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PermissionGuardScreen } from './src/screens/PermissionGuardScreen';
import { DutyToggleScreen } from './src/screens/DutyToggleScreen';
import { TacticalAlertPopup } from './src/components/TacticalAlertPopup';

type ScreenType = 'alerts' | 'details' | 'cases' | 'logs' | 'map' | 'profile';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/connect';

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

function MainApp() {
  const insets = useSafeAreaInsets();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('alerts');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [permissionsAuthorized, setPermissionsAuthorized] = useState(false);
  const [dutyAcknowledged, setDutyAcknowledged] = useState(false);

  // Live state tracking
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [cases, setCases] = useState<CaseItem[]>(INITIAL_CASES);
  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MESSAGES);
  const [officer, setOfficer] = useState<OfficerProfile>(INITIAL_OFFICER);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Tactical Overlay Alert State
  const [tacticalAlertVisible, setTacticalAlertVisible] = useState(false);
  const [incomingTacticalAlert, setIncomingTacticalAlert] = useState<AlertItem | null>(null);

  // Degraded active permissions tracking (fault tolerance)
  const [degradedPermissions, setDegradedPermissions] = useState<('foreground' | 'background' | 'notifications')[]>([]);

  // =====================================================
  // DUTY LIFECYCLE HOOK — Controls entire background layer
  // =====================================================
  useEffect(() => {
    let simulatedAlertTimer: any = null;

    if (isAuthorized) {
      // Register alert callbacks (for both WebSocket and simulated alerts)
      registerAlertCallbacks({
        onNewAlert: (alert) => {
          setAlerts((prev) => {
            if (prev.some((a) => a.id === alert.id)) return prev;
            return [alert, ...prev];
          });
        },
        onTacticalPopup: (alert) => {
          setIncomingTacticalAlert(alert);
          setTacticalAlertVisible(true);
        },
      });

      if (officer.status === 'ACTIVE DUTY') {
        // GO ON DUTY — starts foreground service, WebSocket, GPS, telemetry
        DutyManager.goOnDuty({
          officerId: officer.unitId,
          officerName: officer.name,
          officerRank: officer.rank,
          wsUrl: getResolvedBackendUrls().wsUrl,
          telemetryIntervalMs: 5000,
        });
      } else {
        // GO OFF DUTY — stops everything, removes notification
        DutyManager.goOffDuty();
      }
    } else {
      // LOGGED OUT — stop everything
      DutyManager.goOffDuty();
      unregisterAlertCallbacks();
      setTacticalAlertVisible(false);
      setIncomingTacticalAlert(null);
    }

    return () => {
      DutyManager.goOffDuty();
      unregisterAlertCallbacks();
      if (simulatedAlertTimer) {
        clearTimeout(simulatedAlertTimer);
      }
    };
  }, [isAuthorized, officer.status]);

  // Listen for user clicking a push notification while app is backgrounded
  useEffect(() => {
    let sub: any = null;
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.addNotificationResponseReceivedListener) {
        sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
          const alertId = response.notification.request.content.data?.alertId;
          if (alertId) {
            setAlerts((currentAlerts) => {
              const found = currentAlerts.find((a) => a.id === alertId);
              if (found) {
                setSelectedAlert(found);
                setCurrentScreen('details');
              }
              return currentAlerts;
            });
          }
        });
      }
    } catch (e) {
      // Graceful fallback for non-native environments
    }
    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  // Fetch initial data from backend
  useEffect(() => {
    if (isAuthorized) {
      const fetchBackendData = async () => {
        try {
          const { getAlertsApi, getMissingPersonsApi } = require('./src/services/api');

          const getSafePhotoUrl = (rawPath: string | undefined, fallbackName = 'Unknown') => {
            if (!rawPath) return `https://ui-avatars.com/api/?name=${fallbackName}`;
            const baseUrl = `http://${getResolvedBackendUrls().host}:8000`;
            let photoPath = rawPath.replace(/\\/g, '/');
            const uploadsIdx = photoPath.indexOf('uploads/');
            if (uploadsIdx > -1) photoPath = photoPath.substring(uploadsIdx);
            photoPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
            return `${baseUrl}${photoPath}`;
          };

          const backendCases = await getMissingPersonsApi();
          const mappedCases: CaseItem[] = backendCases.map((c: any) => {
            const finalPhotoUrl = getSafePhotoUrl(c.photo_path, 'Unknown');
            const d = c.date_missing ? new Date(c.date_missing) : null;
            const missingSinceStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString() : 'Recent';
            return {
              id: c.id,
              name: c.full_name,
              age: c.age || 0,
              gender: c.gender || 'UNKNOWN',
              missingSince: missingSinceStr,
              lastSeen: c.last_seen_location || 'Unknown',
              photoUrl: finalPhotoUrl,
              status: c.status?.toUpperCase() || 'ACTIVE',
              caseType: 'MISSING',
              description: c.description || '',
            };
          });
          setCases(mappedCases);

          // Fetch historical alerts that have been forwarded/assigned
          const backendAlerts = await getAlertsApi();
          const forwardedAlerts = backendAlerts.filter(
            (a: any) => ['Verified', 'Assigned', 'Dispatched'].includes(a.status)
          );

          const mappedAlerts = forwardedAlerts.map((a: any) => {
            const finalPhotoUrl = getSafePhotoUrl(a.missing_person?.photo_path, 'Unknown');
            console.log('App.tsx Old Alert URL:', finalPhotoUrl);

            return {
              id: a.id,
              title: 'URGENT ASSIGNMENT',
              subtitle: `Match for ${a.missing_person?.full_name || 'Unknown'}`,
              threatLevel: 'CRITICAL',
              fileNo: a.missing_person?.case_number || 'N/A',
              lastSeenLocation: a.missing_person?.last_seen_location || 'Unknown',
              lastSeenTime: (() => {
                const dt = a.missing_person?.date_missing ? new Date(a.missing_person.date_missing) : null;
                return dt && !isNaN(dt.getTime()) ? dt.toLocaleTimeString() : 'Recent';
              })(),
              mugshotUrl: finalPhotoUrl,
              latitude: a.detection_event?.location_lat || 18.9431,
              longitude: a.detection_event?.location_lng || 72.8246,
              status: 'ALERT',
              assignedOfficer: { name: officer.name, unitId: officer.unitId, rank: officer.rank },
              telemetry: { azimuth: '045°', zoom: '2.4x', lens: '50mm', signal: 'STRONG' }
            };
          });

          setAlerts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueIncoming: AlertItem[] = [];
            for (const item of mappedAlerts) {
              if (!existingIds.has(item.id)) {
                existingIds.add(item.id);
                uniqueIncoming.push(item);
              }
            }
            return [...uniqueIncoming, ...prev];
          });

        } catch (e) {
          console.warn('⚠️ Failed to fetch backend data on load:', e);
        }
      };

      fetchBackendData();
    }
  }, [isAuthorized]);

  // Periodic Permission Monitor Hook (Fault Tolerance)
  useEffect(() => {
    let interval: any;

    const performCheck = async () => {
      if (isAuthorized) {
        const status = await checkAllPermissionsStatus();
        const degraded: ('foreground' | 'background' | 'notifications')[] = [];
        // Only mark degraded if foreground location is denied (since foreground is required to stream GPS)
        if (!status.foreground) {
          degraded.push('foreground');
        }
        setDegradedPermissions(degraded);
      }
    };

    if (isAuthorized) {
      performCheck(); // Run immediate initial check
      interval = setInterval(performCheck, 10000); // Check every 10 seconds
    } else {
      setDegradedPermissions([]);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthorized]);

  const handleRestorePermission = async () => {
    const granted = await requestPermissionType('foreground');
    if (granted) {
      setDegradedPermissions([]);
    }
  };

  // Hardware Back Button Interception (Prevent exit if on duty)
  useEffect(() => {
    const onBackPress = () => {
      if (isAuthorized && officer.status === 'ACTIVE DUTY') {
        if (Platform.OS === 'android') {
          // Send app to background simulating the Home button press
          try {
            const IntentLauncher = require('expo-intent-launcher');
            IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
              category: 'android.intent.category.HOME',
              flags: 268435456, // FLAG_ACTIVITY_NEW_TASK
            }).catch(() => {
              // Fallback if intent fails
              ToastAndroid.show('Garuda Patrol App active. Press Home to minimize, or go OFF DUTY to exit.', ToastAndroid.SHORT);
            });
          } catch (e) {
            ToastAndroid.show('Garuda Patrol App active. Press Home to minimize, or go OFF DUTY to exit.', ToastAndroid.SHORT);
          }
        }
        return true; // Prevent default exit
      }
      return false; // Let default behavior (exit app) proceed
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [isAuthorized, officer.status]);

  // Authentication Callbacks
  const handleLoginSuccess = (data: { unitId: string; role: string; email?: string; full_name?: string }) => {
    setIsAuthorized(true);
    setCurrentScreen('alerts');

    // Update officer state with actual logged in user
    setOfficer(prev => ({
      ...prev,
      name: data.full_name || data.email?.split('@')[0].toUpperCase() || 'OFFICER',
      unitId: data.unitId,
      rank: data.role.toUpperCase(),
      status: 'OFF DUTY',
    }));

    // Telemetry broadcast will be dropped silently until duty is activated
    DutyManager.sendEvent('LOGIN', data.unitId, data.full_name || data.email || 'OFFICER', 'OFFICER LOGGED IN');
  };

  const handleAcknowledgeTacticalAlert = () => {
    setTacticalAlertVisible(false);
    if (incomingTacticalAlert) {
      handleSelectAlert(incomingTacticalAlert);
    }
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
            // Immediate telemetry broadcast BEFORE clearing session
            DutyManager.sendEvent('LOGOUT', officer.unitId, officer.name, 'OFFICER LOGGED OUT');
            setIsAuthorized(false);
            setDutyAcknowledged(false);
            setCurrentScreen('alerts');
            setSelectedAlert(null);
            setAlerts(INITIAL_ALERTS); // Reset alerts to prevent stale duplicates
            setAuditLogs(INITIAL_AUDIT_LOGS); // Reset audit trail
          },
        },
      ]
    );
  };

  const handleDutyAcknowledge = (status: string) => {
    handleUpdateOfficerStatus(status);
    setDutyAcknowledged(true);
  };

  // State update callbacks
  const handleSelectAlert = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setCurrentScreen('details');
  };

  const handleRespondAlert = (alertId: string) => {
    // Proactively update status to 'EN-ROUTE' and add current officer
    const optimisticAssignment = {
      status: 'Accepted',
      officer: { badge_number: officer.unitId, user: { full_name: officer.name } }
    };

    setAlerts((prevAlerts) =>
      prevAlerts.map((a) => {
        if (a.id === alertId) {
          const assignments = a.assignments ? [...a.assignments] : [];
          if (!assignments.some(assign => assign.officer?.badge_number === officer.unitId)) {
            assignments.push(optimisticAssignment);
          }
          return { ...a, status: 'EN-ROUTE', assignments };
        }
        return a;
      })
    );

    const targetAlert = alerts.find((a) => a.id === alertId);
    if (targetAlert) {
      const assignments = targetAlert.assignments ? [...targetAlert.assignments] : [];
      if (!assignments.some(assign => assign.officer?.badge_number === officer.unitId)) {
        assignments.push(optimisticAssignment);
      }
      setSelectedAlert({ ...targetAlert, status: 'EN-ROUTE', assignments });
      setCurrentScreen('details');
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, status: AlertItem['status']) => {
    // Find the alert to get previous status for audit
    const targetAlert = alerts.find((a) => a.id === alertId);
    const previousStatus = targetAlert?.status || 'ALERT';

    try {
      const { updateAlertStatusApi } = require('./src/services/api');
      let statusString = status;
      if (status === 'FALSE ALARM') {
        statusString = 'Rejected False Positive';
      }
      await updateAlertStatusApi(alertId, statusString);
    } catch (e) {
      console.warn('⚠️ [ALERT STATUS] Local status updated; backend sync notice:', e);
    }

    let assignmentStatusStr = 'Accepted';
    if (status === 'INVESTIGATING') assignmentStatusStr = 'Investigating';
    else if (status === 'TARGET LOST') assignmentStatusStr = 'Target Lost';
    else if (status === 'FOUND') assignmentStatusStr = 'Found';
    else if (status === 'FALSE ALARM') assignmentStatusStr = 'False Alarm';

    const optimisticAssignment = status !== 'ALERT' ? {
      status: assignmentStatusStr,
      officer: { badge_number: officer.unitId, user: { full_name: officer.name } }
    } : null;

    const updateAssignments = (assignments: any[]) => {
      if (!optimisticAssignment) return assignments;
      const index = assignments.findIndex(a => a.officer?.badge_number === officer.unitId);
      if (index >= 0) {
        assignments[index].status = optimisticAssignment.status;
      } else {
        assignments.push(optimisticAssignment);
      }
      return assignments;
    };

    setAlerts((prevAlerts) =>
      prevAlerts.map((a) => {
        if (a.id === alertId) {
          const assignments = a.assignments ? [...a.assignments] : [];
          return { ...a, status, assignments: updateAssignments(assignments) };
        }
        return a;
      })
    );

    // Also update selected alert state
    setSelectedAlert((prev) => {
      if (prev && prev.id === alertId) {
        const assignments = prev.assignments ? [...prev.assignments] : [];
        return { ...prev, status, assignments: updateAssignments(assignments) };
      }
      return prev;
    });

    // Append audit log entry
    const newLogEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      alertId,
      alertTitle: targetAlert?.title || alertId,
      fileNo: targetAlert?.fileNo || 'N/A',
      officerName: officer.name,
      unitId: officer.unitId,
      previousStatus,
      newStatus: status,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC',
      note: `Status changed by ${officer.name} from field.`,
    };
    setAuditLogs((prev) => [newLogEntry, ...prev]);
  };

  const handleUpdateOfficerStatus = (status: string) => {
    setOfficer((prev) => ({ ...prev, status }));
    // Duty toggle is handled by the useEffect above reacting to officer.status change
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
    // Send SOS telemetry
    DutyManager.sendEvent('SOS', officer.unitId, officer.name, 'EMERGENCY SOS');

    Alert.alert(
      'EMERGENCY ASSISTANCE ACTIVATED',
      'Emergency distress signal broadcast to central dispatch and active sector patrol units. Backup is being dispatched.',
      [{ text: 'ACKNOWLEDGE', style: 'destructive' }],
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
            currentOfficerId={officer.unitId}
          />
        );
      case 'cases':
        return <CasesScreen cases={cases} />;
      case 'logs':
        return <LogsScreen auditLogs={auditLogs} />;
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

  if (!permissionsAuthorized) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar style="light" />
        <PermissionGuardScreen onAllPermissionsGranted={() => setPermissionsAuthorized(true)} />
      </View>
    );
  }

  if (!isAuthorized) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar style="light" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  if (!dutyAcknowledged) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar style="light" />
        <DutyToggleScreen
          officerName={officer.name}
          onAcknowledge={handleDutyAcknowledge}
        />
      </View>
    );
  }

  // Render full application with top header and bottom tabs navigation
  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" />

      {/* Flashing Degraded Permissions Warning Banner (Fault Tolerance with Inset Protection) */}
      {degradedPermissions.length > 0 && (
        <View style={[styles.warningBanner, { paddingTop: Math.max(insets.top, 12) }]}>
          <MaterialIcons name="warning" size={16} color="#17130a" style={{ marginRight: 6 }} />
          <Text style={styles.warningBannerText}>
            GPS TELEMETRY OFFLINE: LOCATION PERMISSION REQUIRED
          </Text>
          <TouchableOpacity
            style={styles.warningBannerButton}
            onPress={handleRestorePermission}
          >
            <Text style={styles.warningBannerButtonText}>ENABLE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Screen Rendering */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Tactical Full-screen Attention-grabbing Popup (Driver Dispatch Ergonomics) */}
      <TacticalAlertPopup
        visible={tacticalAlertVisible}
        alert={incomingTacticalAlert}
        onAcknowledge={handleAcknowledgeTacticalAlert}
        onAccept={(alertToAccept) => {
          setTacticalAlertVisible(false);
          handleRespondAlert(alertToAccept.id);
        }}
        onDismiss={() => {
          setTacticalAlertVisible(false);
          setIncomingTacticalAlert(null);
        }}
      />

      {/* Standardized Bottom Navigation Shell (hidden in details view) */}
      {currentScreen !== 'details' && (
        <BottomNavigationBar
          currentScreen={currentScreen}
          onSelectScreen={(screen) => setCurrentScreen(screen)}
        />
      )}
    </View>
  );
}

function BottomNavigationBar({
  currentScreen,
  onSelectScreen,
}: {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
}) {
  const insets = useSafeAreaInsets();
  const tabs: { key: ScreenType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { key: 'alerts', label: 'Alerts', icon: 'notifications-active' },
    { key: 'cases', label: 'Cases', icon: 'folder-shared' },
    { key: 'logs', label: 'Logs', icon: 'history' },
    { key: 'map', label: 'Map', icon: 'explore' },
    { key: 'profile', label: 'Profile', icon: 'account-circle' },
  ];

  return (
    <View
      style={[
        styles.bottomNav,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.navItem}
            onPress={() => onSelectScreen(tab.key)}
            hitSlop={8}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.navItemInner,
                  isActive && styles.navItemActive,
                  pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] },
                ]}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={20}
                  color={isActive ? COLORS.primary : COLORS.onSurfaceVariant}
                  style={{ opacity: isActive ? 1 : 0.6 }}
                />
                <Text
                  style={[
                    styles.navLabel,
                    isActive && styles.navLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
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
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: ROUNDED.SM,
  },
  navItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
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
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '600',
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10, 9, 8, 0.25)',
  },
  warningBannerText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    fontWeight: '900',
    color: '#0A0908',
    flex: 1,
    letterSpacing: 0.5,
  },
  warningBannerButton: {
    backgroundColor: '#0A0908',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  warningBannerButtonText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    fontWeight: '800',
    color: '#D4AF37',
  },
});
