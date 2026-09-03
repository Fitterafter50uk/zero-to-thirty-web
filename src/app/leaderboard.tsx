
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROGRESS_KEY = 'zero_to_thirty_progress';

type ProgressData = {
  completedRuns?: number;
  completedWeeks?: number;
  extraRuns?: number;
  extraKm?: number;
  totalKm?: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();

  const [progress, setProgress] = useState<ProgressData>({});
  const [activeTab, setActiveTab] = useState<'week' | 'all'>('week');

  const loadProgress = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PROGRESS_KEY);

      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Leaderboard progress load error:', error);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const programmedRuns = progress.completedRuns || 0;
  const freeRuns = progress.extraRuns || 0;
  const totalRuns = programmedRuns + freeRuns;
  const totalKm = progress.totalKm || progress.extraKm || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>LEADERBOARD</Text>
            <Text style={styles.headerSubTitle}>ZERO TO THIRTY</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* HERO */}

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />

          <Text style={styles.trophy}>🏆</Text>

          <Text style={styles.heroTitle}>
            EARN YOUR PLACE
          </Text>

          <Text style={styles.heroText}>
            Every run counts. Every kilometre matters.
          </Text>
        </View>

        {/* TABS */}

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setActiveTab('week')}
            style={[
              styles.tab,
              activeTab === 'week' && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'week' && styles.activeTabText,
              ]}
            >
              THIS WEEK
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('all')}
            style={[
              styles.tab,
              activeTab === 'all' && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText,
              ]}
            >
              ALL TIME
            </Text>
          </Pressable>
        </View>

        {/* YOUR POSITION */}

        <View style={styles.yourPositionCard}>
          <View>
            <Text style={styles.smallLabel}>YOUR POSITION</Text>
            <Text style={styles.positionText}>—</Text>
          </View>

          <View style={styles.yourStats}>
            <Text style={styles.yourRuns}>{totalRuns}</Text>
            <Text style={styles.yourRunsLabel}>RUNS</Text>
          </View>

          <View style={styles.yourStats}>
            <Text style={styles.yourRuns}>
              {totalKm.toFixed(1)}
            </Text>
            <Text style={styles.yourRunsLabel}>KM</Text>
          </View>
        </View>

        {/* LEADERBOARD */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'week'
              ? 'THIS WEEK'
              : 'ALL TIME'}
          </Text>

          <Text style={styles.sectionAccent}>
            TOP 10
          </Text>
        </View>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyTrophy}>🏃</Text>

          <Text style={styles.emptyTitle}>
            COMMUNITY LEADERBOARD
          </Text>

          <Text style={styles.emptyText}>
            The leaderboard will fill up as runners join
            Zero to Thirty and start recording their runs.
          </Text>

          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>
              COMMUNITY RANKINGS COMING SOON
            </Text>
          </View>
        </View>

        {/* YOUR STATS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            YOUR STATS
          </Text>
        </View>

        <View style={styles.statsGrid}>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {programmedRuns}
            </Text>
            <Text style={styles.statLabel}>
              PROGRAMME RUNS
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {freeRuns}
            </Text>
            <Text style={styles.statLabel}>
              FREE RUNS
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {totalRuns}
            </Text>
            <Text style={styles.statLabel}>
              TOTAL RUNS
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {totalKm.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>
              TOTAL KM
            </Text>
          </View>

        </View>

        {/* BACK TO PROGRESS */}

        <Pressable
          onPress={() => router.push('/progress')}
          style={({ pressed }) => [
            styles.progressButton,
            pressed && styles.progressButtonPressed,
          ]}
        >
          <View style={styles.buttonHighlight} />

          <Text style={styles.progressButtonText}>
            ‹  BACK TO PROGRESS
          </Text>
        </Pressable>

        <View style={styles.bottomSpace} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  header: {
    width: '100%',
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonPressed: {
    transform: [{ scale: 0.94 }],
  },

  backText: {
    color: '#FF8C00',
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '700',
    marginTop: -4,
  },

  headerTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: '#f8f8f8',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
  },

  headerSubTitle: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },

  headerSpacer: {
    width: 48,
  },

  heroCard: {
    width: '100%',
    minHeight: 175,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 12,
  },

  heroGlow: {
    position: 'absolute',
    top: -50,
    width: 180,
    height: 100,
    borderRadius: 100,
    backgroundColor: 'rgba(255,140,0,0.12)',
  },

  trophy: {
    fontSize: 44,
    marginBottom: 5,
  },

  heroTitle: {
    color: '#FF8C00',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
  },

  heroText: {
    color: '#f8f8f8',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 7,
    opacity: 0.9,
  },

  tabs: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#292929',
    marginTop: 15,
    padding: 5,
  },

  tab: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeTab: {
    backgroundColor: '#FF8C00',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 6,
  },

  tabText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  activeTabText: {
    color: '#f8f8f8',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
  },

  yourPositionCard: {
    width: '100%',
    minHeight: 92,
    marginTop: 15,
    borderRadius: 14,
    backgroundColor: '#181818',
    borderWidth: 2,
    borderColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },

  smallLabel: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  positionText: {
    color: '#FF8C00',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },

  yourStats: {
    alignItems: 'center',
    minWidth: 55,
  },

  yourRuns: {
    color: '#f8f8f8',
    fontSize: 22,
    fontWeight: '900',
  },

  yourRunsLabel: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 2,
  },

  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 9,
  },

  sectionTitle: {
    color: '#f8f8f8',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
  },

  sectionAccent: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  emptyCard: {
    width: '100%',
    minHeight: 230,
    borderRadius: 15,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 25,
  },

  emptyTrophy: {
    fontSize: 38,
    marginBottom: 8,
  },

  emptyTitle: {
    color: '#f8f8f8',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  emptyText: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  comingSoonBadge: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255,140,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.45)',
  },

  comingSoonText: {
    color: '#FF8C00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statCard: {
    width: '48%',
    minHeight: 90,
    borderRadius: 14,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  statNumber: {
    color: '#FF8C00',
    fontSize: 25,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
  },

  statLabel: {
    color: '#999999',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
  },

  progressButton: {
    width: '100%',
    minHeight: 62,
    borderRadius: 14,
    backgroundColor: '#FF8C00',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.6,
    shadowRadius: 9,
    elevation: 12,
  },

  progressButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  buttonHighlight: {
    position: 'absolute',
    top: 4,
    left: 25,
    right: 25,
    height: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  progressButtonText: {
    color: '#f8f8f8',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
  },

  bottomSpace: {
    height: 30,
  },
});
