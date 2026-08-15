import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROGRESS_KEY = 'zero_to_thirty_progress';

const primaryColor = '#FF8C00';
const backgroundColor = '#111111';
const cardColor = 'rgba(0,0,0,0.72)';
const textPrimary = '#FFFFFF';
const textSecondary = '#AAAAAA';

export default function FreeRunScreen() {
  const router = useRouter();

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [distance, setDistance] = useState('');

  const [totalKm, setTotalKm] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const [personalBestDistance, setPersonalBestDistance] = useState(0);
  const [personalBestTime, setPersonalBestTime] = useState(0);

  const [lastRuns, setLastRuns] = useState<
    Array<{
      distance: number;
      seconds: number;
    }>
  >([]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSeconds((current) => current + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROGRESS_KEY);

      if (!stored) {
        setTotalKm(0);
        setTotalRuns(0);
        setTotalSeconds(0);
        setPersonalBestDistance(0);
        setPersonalBestTime(0);
        setLastRuns([]);
        return;
      }

      const progress = JSON.parse(stored);

      /*
       * Free Run statistics.
       */
      setTotalKm(Number(progress.freeRunKm || 0));
      setTotalRuns(Number(progress.freeRunRuns || 0));
      setTotalSeconds(Number(progress.freeRunTotalSeconds || 0));

      setPersonalBestDistance(
        Number(progress.freeRunPersonalBestDistance || 0)
      );

      setPersonalBestTime(
        Number(progress.freeRunPersonalBestTime || 0)
      );

      setLastRuns(
        Array.isArray(progress.freeRunLastRuns)
          ? progress.freeRunLastRuns
          : []
      );
    } catch (error) {
      console.log('Could not load free run stats', error);
    }
  };

  const formatTime = (value: number) => {
    const total = Math.max(0, Math.floor(value));

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hours > 0) {
      return (
        String(hours).padStart(2, '0') +
        ':' +
        String(minutes).padStart(2, '0') +
        ':' +
        String(secs).padStart(2, '0')
      );
    }

    return (
      String(minutes).padStart(2, '0') +
      ':' +
      String(secs).padStart(2, '0')
    );
  };

  const startRun = () => {
    setSeconds(0);
    setFinished(false);
    setDistance('');
    setRunning(true);
  };

  const endRun = () => {
    setRunning(false);
    setFinished(true);
  };

  const saveRun = async () => {
    const km = Number(distance);

    if (!Number.isFinite(km) || km <= 0) {
      Alert.alert(
        'ENTER DISTANCE',
        'Please enter the distance you ran.'
      );
      return;
    }

    if (seconds <= 0) {
      Alert.alert(
        'RUN TIME',
        'The run must have a recorded time before it can be saved.'
      );
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(PROGRESS_KEY);
      const progress = stored ? JSON.parse(stored) : {};

      /*
       * EXISTING FREE RUN STATS
       */
      const oldKm = Number(progress.freeRunKm || 0);
      const oldRuns = Number(progress.freeRunRuns || 0);
      const oldTotalSeconds = Number(
        progress.freeRunTotalSeconds || 0
      );

      const oldPBDistance = Number(
        progress.freeRunPersonalBestDistance || 0
      );

      const oldPBTime = Number(
        progress.freeRunPersonalBestTime || 0
      );

      const oldLastRuns = Array.isArray(
        progress.freeRunLastRuns
      )
        ? progress.freeRunLastRuns
        : [];

      /*
       * NEW FREE RUN TOTALS
       */
      const newKm = oldKm + km;
      const newRuns = oldRuns + 1;
      const newTotalSeconds =
        oldTotalSeconds + seconds;

      /*
       * PERSONAL BESTS
       */
      const newPBDistance = Math.max(
        oldPBDistance,
        km
      );

      const newPBTime = Math.max(
        oldPBTime,
        seconds
      );

      /*
       * LAST 3 RUNS
       */
      const newRun = {
        distance: km,
        seconds: seconds,
      };

      const newLastRuns = [
        newRun,
        ...oldLastRuns,
      ].slice(0, 3);

      /*
       * =====================================================
       * SAVE FREE RUN DATA
       * =====================================================
       */
      progress.freeRunKm = newKm;
      progress.freeRunRuns = newRuns;
      progress.freeRunTotalSeconds = newTotalSeconds;

      progress.freeRunPersonalBestDistance =
        newPBDistance;

      progress.freeRunPersonalBestTime =
        newPBTime;

      progress.freeRunLastRuns =
        newLastRuns;

      /*
       * =====================================================
       * KEEP PROGRESS PAGE FREE RUN STATS IN SYNC
       *
       * Progress page uses:
       *   extraRuns
       *   extraKm
       *
       * Therefore these MUST also be updated here.
       * =====================================================
       */
      progress.extraRuns = newRuns;
      progress.extraKm = newKm;

      /*
       * Save everything together.
       */
      await AsyncStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(progress)
      );

      /*
       * Update screen immediately.
       */
      setTotalKm(newKm);
      setTotalRuns(newRuns);
      setTotalSeconds(newTotalSeconds);

      setPersonalBestDistance(newPBDistance);
      setPersonalBestTime(newPBTime);

      setLastRuns(newLastRuns);

      setFinished(false);
      setDistance('');
      setSeconds(0);

      Alert.alert(
        'RUN SAVED',
        km.toFixed(2) +
          ' KM added to your Free Run stats.'
      );
    } catch (error) {
      console.log('Could not save free run', error);

      Alert.alert(
        'ERROR',
        'Could not save the run.'
      );
    }
  };

  /*
   * =========================================================
   * SHOW RESET CONFIRMATION
   * =========================================================
   */
  const resetStats = () => {
    setShowResetConfirm(true);
  };

  /*
   * =========================================================
   * ACTUALLY RESET ALL FREE RUN DATA
   * =========================================================
   */
  const confirmResetStats = async () => {
    try {
      /*
       * Stop any active timer.
       */
      setRunning(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const stored =
        await AsyncStorage.getItem(PROGRESS_KEY);

      const progress = stored
        ? JSON.parse(stored)
        : {};

      /*
       * =====================================================
       * REMOVE FREE RUN PAGE DATA
       * =====================================================
       */
      delete progress.freeRunKm;
      delete progress.freeRunRuns;
      delete progress.freeRunTotalSeconds;
      delete progress.freeRunPersonalBestDistance;
      delete progress.freeRunPersonalBestTime;
      delete progress.freeRunLastRuns;

      /*
       * =====================================================
       * IMPORTANT:
       * REMOVE THE FREE RUN DATA USED BY PROGRESS PAGE TOO.
       *
       * ProgressScreen reads:
       *   progress.extraRuns
       *   progress.extraKm
       *
       * These were previously being left behind.
       * =====================================================
       */
      delete progress.extraRuns;
      delete progress.extraKm;

      /*
       * Remove old Free Run field from earlier versions.
       */
      delete progress.longestFreeRun;

      /*
       * Save the remaining programme progress.
       *
       * Nothing relating to the actual programme weeks
       * is removed.
       */
      await AsyncStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(progress)
      );

      /*
       * =====================================================
       * RESET FREE RUN SCREEN
       * =====================================================
       */
      setTotalKm(0);
      setTotalRuns(0);
      setTotalSeconds(0);

      setPersonalBestDistance(0);
      setPersonalBestTime(0);

      setLastRuns([]);

      setFinished(false);
      setDistance('');
      setSeconds(0);

      /*
       * Close confirmation.
       */
      setShowResetConfirm(false);

      /*
       * Confirm to user.
       */
      Alert.alert(
        'RUN STATS RESET',
        'All Free Run statistics have been reset.'
      );
    } catch (error) {
      console.log(
        'Could not reset free run stats',
        error
      );

      setShowResetConfirm(false);

      Alert.alert(
        'ERROR',
        'Could not reset the Free Run statistics.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>
          FREE RUN
        </Text>

        <Text style={styles.subheading}>
          RUN YOUR OWN RUN
        </Text>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>
            FREE RUN STATS
          </Text>
        </View>

        {/* RESET BUTTON */}

        <Pressable
          style={({ pressed }) => [
            styles.resetButton,
            pressed && styles.resetButtonPressed,
          ]}
          onPress={resetStats}
          onPressIn={() => {}}
          hitSlop={8}
        >
          <Text style={styles.resetText}>
            RESET RUN STATS
          </Text>
        </Pressable>

        {/* RESET CONFIRMATION */}

        {showResetConfirm && (
          <View style={styles.resetConfirmBox}>
            <Text style={styles.resetConfirmTitle}>
              RESET FREE RUN STATS?
            </Text>

            <Text style={styles.resetConfirmText}>
              This will clear your Free Run kilometres,
              runs, total time, personal bests and last
              3 runs. It will also clear the Free Run
              figures shown on the Progress page.
            </Text>

            <View style={styles.resetConfirmButtons}>
              <Pressable
                style={styles.cancelResetButton}
                onPress={() =>
                  setShowResetConfirm(false)
                }
              >
                <Text style={styles.cancelResetText}>
                  CANCEL
                </Text>
              </Pressable>

              <Pressable
                style={styles.confirmResetButton}
                onPress={confirmResetStats}
              >
                <Text style={styles.confirmResetText}>
                  RESET
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* TOP THREE STATS */}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.number}>
              {totalKm.toFixed(2)}
            </Text>

            <Text style={styles.label}>
              KM RAN
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.number}>
              {totalRuns}
            </Text>

            <Text style={styles.label}>
              RUNS
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.number}>
              {formatTime(totalSeconds)}
            </Text>

            <Text style={styles.label}>
              TIME RAN
            </Text>
          </View>
        </View>

        {/* PERSONAL BEST DISTANCE */}

        <View style={styles.pbBox}>
          <View style={styles.pbLeft}>
            <Text style={styles.trophy}>
              🏆
            </Text>

            <View>
              <Text style={styles.pbSmall}>
                PERSONAL BEST
              </Text>

              <Text style={styles.pbTitle}>
                LONGEST DISTANCE
              </Text>
            </View>
          </View>

          <Text style={styles.pbValue}>
            {personalBestDistance.toFixed(2)} KM
          </Text>
        </View>

        {/* PERSONAL BEST TIME */}

        <View style={styles.pbBox}>
          <View style={styles.pbLeft}>
            <Text style={styles.trophy}>
              🏆
            </Text>

            <View>
              <Text style={styles.pbSmall}>
                PERSONAL BEST
              </Text>

              <Text style={styles.pbTitle}>
                LONGEST TIME
              </Text>
            </View>
          </View>

          <Text style={styles.pbValue}>
            {formatTime(personalBestTime)}
          </Text>
        </View>

        {/* LAST 3 RUNS */}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>
            LAST 3 FREE RUNS
          </Text>
        </View>

        {lastRuns.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              NO FREE RUNS RECORDED YET
            </Text>
          </View>
        ) : (
          lastRuns.map((run, index) => (
            <View
              key={`${run.seconds}-${run.distance}-${index}`}
              style={styles.lastRunBox}
            >
              <View>
                <Text style={styles.lastRunNumber}>
                  RUN {index + 1}
                </Text>

                <Text style={styles.lastRunTime}>
                  {formatTime(run.seconds)}
                </Text>
              </View>

              <Text style={styles.lastRunDistance}>
                {Number(run.distance).toFixed(2)} KM
              </Text>
            </View>
          ))
        )}

        {/* TIMER */}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>
            FREE RUN
          </Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>
            {formatTime(seconds)}
          </Text>
        </View>

        {!running && !finished && (
          <Pressable
            style={styles.startButton}
            onPress={startRun}
          >
            <Text style={styles.startText}>
              START RUN
            </Text>
          </Pressable>
        )}

        {running && (
          <Pressable
            style={styles.endButton}
            onPress={endRun}
          >
            <Text style={styles.endText}>
              END RUN
            </Text>
          </Pressable>
        )}

        {finished && (
          <View style={styles.saveBox}>
            <Text style={styles.saveTitle}>
              RUN COMPLETE
            </Text>

            <Text style={styles.saveTime}>
              Time: {formatTime(seconds)}
            </Text>

            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={setDistance}
              placeholder="Distance in KM"
              placeholderTextColor="#666666"
              keyboardType="decimal-pad"
            />

            <Pressable
              style={styles.saveButton}
              onPress={saveRun}
            >
              <Text style={styles.saveText}>
                SAVE RUN
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.footer}>
          KEEP MOVING FORWARD
        </Text>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}

      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/')}
        >
          <Text style={styles.navIcon}>⌂</Text>

          <Text style={styles.navText}>
            HOME
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/weeks')}
        >
          <Text style={styles.navIcon}>▶</Text>

          <Text style={styles.navText}>
            PROGRAMME
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/progress')}
        >
          <Text style={styles.navIcon}>✓</Text>

          <Text style={styles.navText}>
            PROGRESS
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/free-run')}
        >
          <Text style={styles.navIcon}>🏃</Text>

          <Text style={styles.navText}>
            FREE RUN
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/community')}
        >
          <Text style={styles.navIcon}>👥</Text>

          <Text style={styles.navText}>
            COMMUNITY
          </Text>
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
    paddingTop: 22,
    paddingBottom: 100,
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
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 6,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  sectionHeading: {
    width: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 27,
    marginBottom: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 4,
  },

  sectionHeadingText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  resetButton: {
    width: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 4,

    zIndex: 20,
  },

  resetButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  resetText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  resetConfirmBox: {
    width: '100%',
    backgroundColor: cardColor,
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },

  resetConfirmTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.8,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  resetConfirmText: {
    color: '#AAAAAA',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
  },

  resetConfirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelResetButton: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelResetText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  confirmResetButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmResetText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,

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
    marginTop: 0,
  },

  stat: {
    flex: 1,
    backgroundColor: cardColor,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },

  number: {
    color: '#FF8C00',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  label: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginTop: 3,
    textAlign: 'center',
  },

  pbBox: {
    width: '100%',
    minHeight: 78,
    backgroundColor: cardColor,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingHorizontal: 15,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },

  pbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  trophy: {
    fontSize: 25,
    marginRight: 10,
  },

  pbSmall: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
  },

  pbTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  pbValue: {
    color: '#FF8C00',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  emptyBox: {
    width: '100%',
    minHeight: 65,
    backgroundColor: cardColor,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },

  emptyText: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  lastRunBox: {
    width: '100%',
    minHeight: 65,
    backgroundColor: cardColor,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },

  lastRunNumber: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  lastRunTime: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },

  lastRunDistance: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: '900',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  timerBox: {
    width: '100%',
    backgroundColor: cardColor,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 20,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },

  timer: {
    color: '#FF8C00',
    fontSize: 55,
    fontWeight: '900',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  startButton: {
    width: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 14,
    paddingVertical: 17,
    marginTop: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 7,
  },

  startText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.8,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  endButton: {
    width: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 17,
    marginTop: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 7,
  },

  endText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.8,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  saveBox: {
    width: '100%',
    backgroundColor: cardColor,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },

  saveTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  saveTime: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },

  input: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 18,
    marginBottom: 12,
  },

  saveButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    paddingVertical: 16,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  footer: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 14,
  },

  bottomNav: {
    width: '100%',
    maxWidth: 700,
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