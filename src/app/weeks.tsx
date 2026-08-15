import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';

const PROGRESS_KEY = 'zero_to_thirty_progress';

const weeks = [
  { week: 1, title: 'GET STARTED', detail: 'Build the habit' },
  { week: 2, title: 'FIND YOUR RHYTHM', detail: 'Build consistency' },
  { week: 3, title: 'BUILDING FITNESS', detail: 'Run a little longer' },
  { week: 4, title: 'GETTING STRONGER', detail: 'Keep progressing' },
  { week: 5, title: 'PUSH FORWARD', detail: 'More running time' },
  { week: 6, title: 'BUILD ENDURANCE', detail: 'Stay with it' },
  { week: 7, title: 'NEARLY THERE', detail: 'Longer running periods' },
  { week: 8, title: 'FINAL PUSH', detail: 'Almost 30 minutes' },
  { week: 9, title: 'ZERO TO THIRTY', detail: 'Your 30-minute goal' },
];

export default function WeeksScreen() {
  const router = useRouter();

  const [progress, setProgress] = useState<Record<string, any>>({});

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

  async function loadProgress() {
    try {
      const saved = await AsyncStorage.getItem(PROGRESS_KEY);

      if (saved) {
        setProgress(JSON.parse(saved));
      } else {
        setProgress({});
      }
    } catch (error) {
      console.log('Could not load progress', error);
    }
  }

  function getCompletedRuns(weekNumber: number) {
    const saved = progress[weekNumber];

    if (Array.isArray(saved)) {
      return saved;
    }

    return [];
  }

  function isWeekUnlocked(weekNumber: number) {
    if (weekNumber === 1) {
      return true;
    }

    const previousRuns =
      getCompletedRuns(weekNumber - 1);

    return previousRuns.length >= 3;
  }

  async function resetProgramme() {
    const confirmed = window.confirm(
      'Are you sure you want to reset the entire programme?\n\nThis will clear all completed runs and restart your progress from Week 1.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await AsyncStorage.removeItem(PROGRESS_KEY);
      router.replace('/weeks');
    } catch (error) {
      console.log('Could not reset programme', error);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.heading}>
          START YOUR JOURNEY
        </Text>

        <Text style={styles.subheading}>
          ZERO TO THIRTY
        </Text>

        <Text style={styles.intro}>
          NO PACE, NO PRESSURE,NO PROBLEM.
        </Text>

        <Pressable
          style={styles.resetProgrammeButton}
          onPress={resetProgramme}
        >
          <Text style={styles.resetProgrammeText}>
            RESET PROGRAMME
          </Text>
        </Pressable>

        <Text style={styles.chooseTitle}>
          CHOOSE YOUR WEEK
        </Text>

        <View style={styles.weekList}>
          {weeks.map((item) => {
            const unlocked =
              isWeekUnlocked(item.week);

            return (
              <Pressable
                key={item.week}
                style={[
                  styles.weekButton,
                  !unlocked && styles.lockedWeekButton,
                ]}
                disabled={!unlocked}
                onPress={() =>
                  router.push(
                    `/workout?week=${item.week}`
                  )
                }
              >
                <View
                  style={[
                    styles.weekNumber,
                    !unlocked &&
                      styles.lockedWeekNumber,
                  ]}
                >
                  <Text style={styles.weekNumberText}>
                    {item.week}
                  </Text>
                </View>

                <View style={styles.weekText}>
                  <Text
                    style={[
                      styles.weekTitle,
                      !unlocked &&
                        styles.lockedText,
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={[
                      styles.weekDetail,
                      !unlocked &&
                        styles.lockedDetail,
                    ]}
                  >
                    {unlocked
                      ? item.detail
                      : 'Complete 3 runs from previous week'}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.arrow,
                    !unlocked &&
                      styles.lockedArrow,
                  ]}
                >
                  {unlocked ? '›' : '🔒'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.footer}>
          3 RUNS PER WEEK TO KEEP MOVING FORWARD
        </Text>

        {/* BOTTOM NAVIGATION */}

        <View style={styles.bottomNav}>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/')}
          >
            <Text style={styles.navIcon}>
              ⌂
            </Text>

            <Text style={styles.navText}>
              HOME
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/weeks')}
          >
            <Text style={styles.navIcon}>
              ▶
            </Text>

            <Text style={styles.navText}>
              PROGRAMME
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/progress')}
          >
            <Text style={styles.navIcon}>
              ✓
            </Text>

            <Text style={styles.navText}>
              PROGRESS
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/free-run')}
          >
            <Text style={styles.navIcon}>
              🏃
            </Text>

            <Text style={styles.navText}>
              FREE RUN
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/community')}
          >
            <Text style={styles.navIcon}>
              👥
            </Text>

            <Text style={styles.navText}>
              COMMUNITY
            </Text>
          </Pressable>

        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },

  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 45,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 3,
      height: 3,
    },
    textShadowRadius: 3,
  },

  subheading: {
    color: '#FF8C00',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 8,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  intro: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 600,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  stats: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 25,
  },

  stat: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },

  number: {
    color: '#FF8C00',
    fontSize: 30,
    fontWeight: '900',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 3,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  chooseTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 15,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  weekList: {
    width: '100%',
    gap: 10,
  },

  weekButton: {
    width: '100%',
    minHeight: 72,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },

  lockedWeekButton: {
    opacity: 0.45,
  },

  weekNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockedWeekNumber: {
    backgroundColor: '#555555',
  },

  weekNumberText: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',

    textShadowColor: '#FFFFFF',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  weekText: {
    flex: 1,
    marginLeft: 14,
  },

  weekTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  lockedText: {
    color: '#999999',
  },

  weekDetail: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 3,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  lockedDetail: {
    color: '#777777',
  },

  arrow: {
    color: '#FF8C00',
    fontSize: 34,
    fontWeight: '300',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  lockedArrow: {
    fontSize: 17,
  },

  footer: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 25,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  resetProgrammeButton: {
    width: '100%',
    backgroundColor: '#D32F2F',
    borderWidth: 2,
    borderColor: '#FF5252',
    borderRadius: 14,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 4,
  },

  resetProgrammeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  bottomNav: {
    width: '100%',
    maxWidth: 650,
    minHeight: 75,
    alignSelf: 'center',
    backgroundColor: '#111111',
    borderTopWidth: 2,
    borderTopColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  navIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: 3,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  navText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },
});