import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TextInput,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';
import { CaseItem } from '../utils/mockState';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SurfaceCard } from '../components/SurfaceCard';

interface CasesScreenProps {
  cases: CaseItem[];
}

export const CasesScreen: React.FC<CasesScreenProps> = ({ cases }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return cases;
    const q = searchQuery.toLowerCase();
    return cases.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastSeen.toLowerCase().includes(q) ||
        c.caseType.toLowerCase().includes(q)
    );
  }, [cases, searchQuery]);

  const renderCaseItem = ({ item }: { item: CaseItem }) => {
    const isWanted = item.caseType === 'WANTED';
    const isActive = item.status === 'ACTIVE';

    return (
      <SurfaceCard style={styles.card}>
        <View style={styles.cardRow}>
          {/* Subject Photo */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: item.photoUrl }}
              style={styles.photo}
              defaultSource={require('../../assets/icon.png')}
            />
            <View
              style={[
                styles.typeTag,
                { backgroundColor: isWanted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(6, 182, 212, 0.9)' },
              ]}
            >
              <Text style={styles.typeText}>{item.caseType}</Text>
            </View>
          </View>

          {/* Case Details */}
          <View style={styles.detailsCol}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    borderColor: isActive ? COLORS.secondary : COLORS.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: isActive ? '#4ade80' : COLORS.onSurfaceVariant },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>PROFILE</Text>
                <Text style={styles.gridVal}>
                  {item.age} YRS · {item.gender}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>LAST KNOWN LOCATION</Text>
                <Text style={styles.gridVal} numberOfLines={1}>
                  {item.lastSeen}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>MISSING SINCE</Text>
                <Text style={styles.gridValMono}>{item.missingSince}</Text>
              </View>
            </View>
          </View>
        </View>
      </SurfaceCard>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="folder-shared" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>ACTIVE DOSSIERS</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cases.length} REGISTERED</Text>
        </View>
      </View>

      {/* Search Filter Strip */}
      <View style={styles.searchStrip}>
        <MaterialIcons name="search" size={18} color={COLORS.onSurfaceVariant} style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter by name or location..."
          placeholderTextColor={COLORS.outline}
          style={styles.searchInput}
          keyboardAppearance="dark"
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <MaterialIcons name="close" size={16} color={COLORS.onSurfaceVariant} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filteredCases}
        keyExtractor={(item) => item.id}
        renderItem={renderCaseItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="folder-open" size={48} color={COLORS.outline} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Matching Cases</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filter query or synchronize with headquarters.</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    height: SPACING.touchTargetMin + 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineSmMobile,
    color: COLORS.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.FULL,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainer,
  },
  badgeText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  searchStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginHorizontal: SPACING.gutter,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    paddingVertical: 0,
  },
  listContent: {
    padding: SPACING.gutter,
    paddingBottom: 96,
  },
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoContainer: {
    width: 84,
    height: 84,
    borderRadius: ROUNDED.MD,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  typeTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: 'center',
  },
  typeText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.SM,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  grid: {
    gap: 3,
  },
  gridItem: {},
  gridLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
  },
  gridVal: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '500',
  },
  gridValMono: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
});
