import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROGRESS_KEY = 'zero_to_thirty_progress';

const PREVIEW_WORKOUTS = {
  1: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 60 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 60 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 60 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 60 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 60 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 60 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 120 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],

  2: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 120 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 120 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 120 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 120 },
    { type: 'WALK', duration: 180 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],

  3: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 120 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],

  4: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 120 },
    { type: 'RUN', duration: 240 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],

  5: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 240 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 180 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 240 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 240 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],

  6: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 300 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 300 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 300 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 420 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],

  7: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 720 },
    { type: 'WALK', duration: 180 },
    { type: 'RUN', duration: 600 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],

  8: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 660 },
    { type: 'WALK', duration: 60 },
    { type: 'RUN', duration: 840 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],

  9: [
    { type: 'WALK', name: 'Warm-up', duration: 300 },
    { type: 'RUN', duration: 1800 },
    { type: 'WALK', name: 'Cool-down', duration: 300 },
  ],
};

const WEEK_NAMES = {
  1: 'GET STARTED',
  2: 'FIND YOUR RHYTHM',
  3: 'BUILDING FITNESS',
  4: 'GETTING STRONGER',
  5: 'PUSH FORWARD',
  6: 'BUILD ENDURANCE',
  7: 'NEARLY THERE',
  8: 'FINAL PUSH',
  9: 'ZERO TO THIRTY',
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} MIN`;
  }

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

function getSegmentName(
  segment: {
    type: string;
    name?: string;
    duration: number;
  },
  index: number,
  workout: readonly {
    type: string;
    name?: string;
    duration: number;
  }[]
) {
  if (segment.name === 'Warm-up') {
    return 'WARM-UP WALK';
  }

  if (segment.name === 'Cool-down') {
    return 'COOL-DOWN WALK';
  }

  if (segment.type === 'RUN') {
    const laterRun = workout
      .slice(index + 1)
      .some((item) => item.type === 'RUN');

    return laterRun ? 'RUN' : 'FINAL RUN';
  }

  return 'WALK';
}

export default function WorkoutScreen() {
  const { week } = useLocalSearchParams();
  const router = useRouter();

  const weekNumber = Math.min(
    9,
    Math.max(1, Number(week) || 1)
  ) as keyof typeof PREVIEW_WORKOUTS;

  const previewWorkout = PREVIEW_WORKOUTS[weekNumber];

  const [completedRuns, setCompletedRuns] = useState<number[]>([]);

  useFocusEffect(
  useCallback(() => {
    loadProgress();
  }, [weekNumber])
);

  async function loadProgress() {
    try {
      const saved = await AsyncStorage.getItem(PROGRESS_KEY);

      if (!saved) {
        setCompletedRuns([]);
        return;
      }

      const progress = JSON.parse(saved);

const savedRuns = Array.isArray(progress[weekNumber])
  ? progress[weekNumber]
  : [];

setCompletedRuns(savedRuns);
    } catch (error) {
      console.log('Could not load workout progress', error);
    }
  }

  function isRunUnlocked(runNumber: number) {
    if (runNumber === 1) {
      return true;
    }

    return completedRuns.includes(runNumber - 1);
  }

  function startRun(runNumber: number) {
    if (!isRunUnlocked(runNumber)) {
      return;
    }

    router.push(
      `/run?week=${weekNumber}&run=${runNumber}`
    );
  }
async function resetWeekProgress() {
  const confirmed = window.confirm(
    `Are you sure you want to reset Week ${weekNumber}?\n\nThis will clear all completed runs for this week.`
  );

  if (!confirmed) {
    return;
  }

  try {
    const saved = await AsyncStorage.getItem(PROGRESS_KEY);
    const progress = saved ? JSON.parse(saved) : {};

    progress[weekNumber] = 0;

    await AsyncStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify(progress)
    );

    setCompletedRuns([]);
  } catch (error) {
    console.log('Could not reset workout progress', error);
  }
}
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.week}>
          WEEK {weekNumber}
        </Text>

        <Text style={styles.title}>
          {WEEK_NAMES[weekNumber]}
        </Text>
<Pressable
  style={styles.restButton}
  onPress={resetWeekProgress}
>
  <Text style={styles.restButtonText}>
    RESET PROGRAMME
  </Text>
</Pressable>
        <View style={styles.workoutBox}>
          <Text style={styles.boxTitle}>
            TODAY'S WORKOUT
          </Text>

          <View style={styles.workoutBar}>
            {previewWorkout.map((segment, index) => (
              <View
                key={index}
                style={[
                  styles.workoutSegment,
                  segment.name === 'Warm-up'
                    ? styles.warmupSegment
                    : segment.name === 'Cool-down'
                    ? styles.cooldownSegment
                    : segment.type === 'RUN'
                    ? styles.runSegment
                    : styles.walkSegment,
                  { flex: segment.duration },
                ]}
              />
            ))}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendBox,
                  styles.warmupSegment,
                ]}
              />
              <Text style={styles.legendText}>
                WARM-UP WALK
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendBox,
                  styles.runSegment,
                ]}
              />
              <Text style={styles.legendText}>
                RUN
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendBox,
                  styles.walkSegment,
                ]}
              />
              <Text style={styles.legendText}>
                WALK
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendBox,
                  styles.cooldownSegment,
                ]}
              />
              <Text style={styles.legendText}>
                COOL-DOWN WALK
              </Text>
            </View>
          </View>

          <View style={styles.intervalList}>
            {previewWorkout.map((segment, index) => (
              <View
                key={index}
                style={styles.intervalRow}
              >
                <View
                  style={[
                    styles.intervalDot,
                    segment.name === 'Warm-up'
                      ? styles.warmupSegment
                      : segment.name === 'Cool-down'
                      ? styles.cooldownSegment
                      : segment.type === 'RUN'
                      ? styles.runSegment
                      : styles.walkSegment,
                  ]}
                />

                <Text style={styles.intervalName}>
                  {getSegmentName(
                    segment,
                    index,
                    previewWorkout
                  )}
                </Text>

                <Text style={styles.intervalDuration}>
                  {formatDuration(segment.duration)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.runsTitle}>
          YOUR 3 RUNS
        </Text>

        <Text style={styles.runsSubtitle}>
          COMPLETE EACH RUN TO MOVE FORWARD
        </Text>

        <View style={styles.runList}>
          {[1, 2, 3].map((runNumber) => {
            const completed =
              completedRuns.includes(runNumber);

            const unlocked =
              isRunUnlocked(runNumber);

            return (
              <View
                key={runNumber}
                style={[
                  styles.runCard,
                  !unlocked && styles.lockedRunCard,
                  completed && styles.completedRunCard,
                ]}
              >
                <View style={styles.runNumber}>
                  <Text style={styles.runNumberText}>
                    {runNumber}
                  </Text>
                </View>

                <View style={styles.runInfo}>
                  <Text style={styles.runTitle}>
                    RUN {runNumber}
                  </Text>

                  <Text style={styles.runStatus}>
                    {completed
                      ? '✓ COMPLETED'
                      : unlocked
                      ? 'READY TO START'
                      : '🔒 COMPLETE PREVIOUS RUN'}
                  </Text>
                </View>

                {unlocked && (
                  <Pressable
                    style={[
                      styles.runButton,
                      completed &&
                        styles.repeatButton,
                    ]}
                    onPress={() =>
                      startRun(runNumber)
                    }
                  >
                    <Text style={styles.runButtonText}>
                      {completed
                        ? 'REPEAT RUN'
                        : 'START RUN'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        
{completedRuns.length === 3 ? (
  <Pressable
    style={styles.weekCompleteButton}
    onPress={() => router.push('/weeks')}
  >
    <Text style={styles.weekCompleteButtonText}>
      BACK TO WEEK SELECTION
    </Text>
  </Pressable>
) : (
  <Text style={styles.message}>
    Complete all 3 runs to finish Week {weekNumber}.
  </Text>
)}

      </ScrollView>

<View style={styles.bottomNav}>

  <Pressable
    style={styles.navItem}
    onPress={() => router.push('/')}
  >
    <Text style={styles.navIcon}>⌂</Text>
    <Text style={styles.navText}>HOME</Text>
  </Pressable>


  <Pressable
    style={styles.navItem}
    onPress={() => router.push('/weeks')}
  >
    <Text style={styles.navIcon}>▶</Text>
    <Text style={styles.navText}>PROGRAMME</Text>
  </Pressable>


  <Pressable
    style={styles.navItem}
    onPress={() => router.push('/progress')}
  >
    <Text style={styles.navIcon}>✓</Text>
    <Text style={styles.navText}>PROGRESS</Text>
  </Pressable>


  <Pressable
    style={styles.navItem}
    onPress={() => router.push('/free-run')}
  >
    <Text style={styles.navIcon}>🏃</Text>
    <Text style={styles.navText}>FREE RUN</Text>
  </Pressable>


  <Pressable
    style={styles.navItem}
    onPress={() => router.push('/community')}
  >
    <Text style={styles.navIcon}>👥</Text>
    <Text style={styles.navText}>COMMUNITY</Text>
  </Pressable>

</View>

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
    paddingTop: 35,
    paddingBottom: 45,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },

  week: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },

  workoutBox: {
    width: '100%',
    maxWidth: 650,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    padding: 25,
    marginTop: 30,
    alignItems: 'center',
  },

  boxTitle: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 20,
  },

  workoutBar: {
    width: '100%',
    height: 34,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333333',
  },

  workoutSegment: {
    height: '100%',
  },

  warmupSegment: {
    backgroundColor: '#4CAF50',
  },

  runSegment: {
    backgroundColor: '#FF8C00',
  },

  walkSegment: {
    backgroundColor: '#555555',
  },

  cooldownSegment: {
    backgroundColor: '#2196F3',
  },

  legend: {
  width: '100%',
  marginTop: 18,
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  columnGap: 18,
  rowGap: 8,
},

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 8,
  },

  legendText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  intervalList: {
  width: '100%',
  marginTop: 20,
  borderTopWidth: 1,
  borderTopColor: '#333333',
  paddingTop: 12,
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
},

  intervalRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 5,
  paddingHorizontal: 4,
},

  intervalDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  marginRight: 6,
},

  intervalName: {
  color: '#FFFFFF',
  fontSize: 11,
  fontWeight: '800',
},

  intervalDuration: {
  color: '#FF8C00',
  fontSize: 11,
  fontWeight: '900',
  marginLeft: 5,
},
  runsTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 30,
  },

  runsSubtitle: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 5,
  },

  runList: {
    width: '100%',
    maxWidth: 650,
    marginTop: 18,
    gap: 12,
  },

  runCard: {
    width: '100%',
    minHeight: 82,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  completedRunCard: {
    borderColor: '#4CAF50',
  },

  lockedRunCard: {
    opacity: 0.45,
    borderColor: '#444444',
  },

  runNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  runNumberText: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },

  runInfo: {
    flex: 1,
    marginLeft: 14,
  },

  runTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  runStatus: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
  },

  runButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  repeatButton: {
    backgroundColor: '#4CAF50',
  },

  runButtonText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '900',
  },

  message: {
    color: '#777777',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 22,
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
},

navText: {
  color: '#FFFFFF',
  fontSize: 8,
  fontWeight: '800',
  textAlign: 'center',
},
restButton: {
  width: '100%',
  maxWidth: 650,
  marginTop: 18,
  backgroundColor: '#D32F2F',
  borderWidth: 2,
  borderColor: '#FF5252',
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: 'center',
},

restButtonText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '900',
  letterSpacing: 1,
},
weekCompleteButton: {
  width: '100%',
  maxWidth: 650,
  marginTop: 25,
  minHeight: 65,
  backgroundColor: '#FF8C00',
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 5,
  },
  shadowOpacity: 0.35,
  shadowRadius: 5,

  elevation: 8,
},
weekCompleteButtonText: {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: '900',
  letterSpacing: 1,

  textShadowColor: '#000000',
  textShadowOffset: {
    width: 2,
    height: 2,
  },
  textShadowRadius: 3,
},

});