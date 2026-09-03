import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROGRESS_KEY = 'zero_to_thirty_progress';

const ORANGE = '#FF8C00';
const GREEN = '#22C55E';
const RED = '#EF4444';
const BLACK = '#111111';
const CARD = 'rgba(0,0,0,0.72)';
const WHITE = '#FFFFFF';
const GREY = '#AAAAAA';

type LastRun = {
  distance: number;
  seconds: number;
};

export default function FreeRunScreen() {
  const router = useRouter();

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const [gpsDistance, setGpsDistance] = useState(0);
  const gpsDistanceRef = useRef(0);

  const [gpsStatus, setGpsStatus] = useState('GPS OFF');

  const [totalKm, setTotalKm] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const [personalBestDistance, setPersonalBestDistance] = useState(0);
  const [personalBestTime, setPersonalBestTime] = useState(0);

  const [lastRuns, setLastRuns] = useState<LastRun[]>([]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const lastPositionRef = useRef<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const gpsStartedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  useEffect(() => {
    return () => {
      stopGps();

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
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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

  const toRadians = (value: number) => {
    return (value * Math.PI) / 180;
  };

  const calculateDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const earthRadiusKm = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadiusKm * c;
  };

  const stopGps = () => {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.geolocation &&
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = null;
    lastPositionRef.current = null;
    gpsStartedRef.current = false;
  };

  const startGps = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      setGpsStatus('GPS NOT AVAILABLE');
      return false;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setGpsStatus('GPS NOT AVAILABLE');
      Alert.alert(
        'GPS NOT AVAILABLE',
        'This device/browser does not provide GPS location.'
      );
      return false;
    }

    try {
      setGpsStatus('GPS SEARCHING');
      lastPositionRef.current = null;

      const success = (position: GeolocationPosition) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy ?? 999;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return;
        }

        setGpsStatus('GPS ACTIVE');

        if (lastPositionRef.current) {
          const segmentKm = calculateDistanceKm(
            lastPositionRef.current.latitude,
            lastPositionRef.current.longitude,
            latitude,
            longitude
          );

          /*
           * Ignore tiny GPS jitter.
           * 0.003 km = 3 metres.
           */
          if (segmentKm >= 0.003 && segmentKm <= 0.5) {
            gpsDistanceRef.current += segmentKm;

            setGpsDistance(
              gpsDistanceRef.current
            );
          }
        }

        lastPositionRef.current = {
          latitude,
          longitude,
          accuracy,
        };
      };

      const error = (error: GeolocationPositionError) => {
        console.log(
          'Browser GPS error:',
          error.code,
          error.message
        );

        if (error.code === 1) {
          setGpsStatus('GPS DENIED');
        } else if (error.code === 2) {
          setGpsStatus('GPS SEARCHING');
        } else {
          setGpsStatus('GPS ERROR');
        }
      };

      watchIdRef.current =
        navigator.geolocation.watchPosition(
          success,
          error,
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 15000,
          }
        );

      gpsStartedRef.current = true;

      return true;
    } catch (error) {
      console.log('Could not start browser GPS', error);
      setGpsStatus('GPS ERROR');
      return false;
    }
  };

  const formatTime = (value: number) => {
    const total = Math.max(0, Math.floor(value));

    const hours = Math.floor(total / 3600);

    const minutes = Math.floor(
      (total % 3600) / 60
    );

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

  const startRun = async () => {
    stopGps();

    setSeconds(0);
    setFinished(false);

    setGpsDistance(0);
    gpsDistanceRef.current = 0;

    setGpsStatus('GPS STARTING');

    const gpsStarted = await startGps();

    if (!gpsStarted) {
      return;
    }

    setRunning(true);
  };

  const endRun = () => {
    setRunning(false);
    stopGps();
    setFinished(true);
    setGpsStatus('GPS OFF');
  };

  const saveRun = async () => {
    const km = Number(
      gpsDistanceRef.current.toFixed(2)
    );

    if (!Number.isFinite(km) || km <= 0) {
      Alert.alert(
        'NO GPS DISTANCE',
        'No GPS running distance was recorded. Please make sure location is enabled and try again.'
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
      const stored =
        await AsyncStorage.getItem(PROGRESS_KEY);

      const progress = stored
        ? JSON.parse(stored)
        : {};

      const oldKm =
        Number(progress.freeRunKm || 0);

      const oldRuns =
        Number(progress.freeRunRuns || 0);

      const oldTotalSeconds =
        Number(
          progress.freeRunTotalSeconds || 0
        );

      const oldPBDistance =
        Number(
          progress.freeRunPersonalBestDistance ||
            0
        );

      const oldPBTime =
        Number(
          progress.freeRunPersonalBestTime || 0
        );

      const oldLastRuns =
        Array.isArray(progress.freeRunLastRuns)
          ? progress.freeRunLastRuns
          : [];

      const newKm = oldKm + km;
      const newRuns = oldRuns + 1;

      const newTotalSeconds =
        oldTotalSeconds + seconds;

      const newPBDistance = Math.max(
        oldPBDistance,
        km
      );

      const newPBTime = Math.max(
        oldPBTime,
        seconds
      );

      const newRun = {
        distance: km,
        seconds,
      };

      const newLastRuns = [
        newRun,
        ...oldLastRuns,
      ].slice(0, 3);

      progress.freeRunKm = newKm;
      progress.freeRunRuns = newRuns;
      progress.freeRunTotalSeconds =
        newTotalSeconds;

      progress.freeRunPersonalBestDistance =
        newPBDistance;

      progress.freeRunPersonalBestTime =
        newPBTime;

      progress.freeRunLastRuns =
        newLastRuns;

      progress.extraRuns = newRuns;
      progress.extraKm = newKm;

      await AsyncStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(progress)
      );

      setTotalKm(newKm);
      setTotalRuns(newRuns);
      setTotalSeconds(newTotalSeconds);

      setPersonalBestDistance(
        newPBDistance
      );

      setPersonalBestTime(newPBTime);

      setLastRuns(newLastRuns);

      setRunning(false);
      setFinished(false);

      stopGps();

      setGpsDistance(0);
      gpsDistanceRef.current = 0;

      setGpsStatus('GPS OFF');
      setSeconds(0);

      Alert.alert(
        'RUN SAVED',
        `${km.toFixed(
          2
        )} KM added to your Free Run stats.`
      );
    } catch (error) {
      console.log(
        'Could not save free run',
        error
      );

      Alert.alert(
        'ERROR',
        'Could not save the run.'
      );
    }
  };

  const resetStats = () => {
    setShowResetConfirm(true);
  };

  const confirmResetStats = async () => {
    try {
      setRunning(false);
      stopGps();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const stored =
        await AsyncStorage.getItem(
          PROGRESS_KEY
        );

      const progress = stored
        ? JSON.parse(stored)
        : {};

      delete progress.freeRunKm;
      delete progress.freeRunRuns;
      delete progress.freeRunTotalSeconds;
      delete progress.freeRunPersonalBestDistance;
      delete progress.freeRunPersonalBestTime;
      delete progress.freeRunLastRuns;

      delete progress.extraRuns;
      delete progress.extraKm;
      delete progress.longestFreeRun;

      await AsyncStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(progress)
      );

      setTotalKm(0);
      setTotalRuns(0);
      setTotalSeconds(0);

      setPersonalBestDistance(0);
      setPersonalBestTime(0);
      setLastRuns([]);

      setFinished(false);

      setGpsDistance(0);
      gpsDistanceRef.current = 0;

      setGpsStatus('GPS OFF');
      setSeconds(0);

      setShowResetConfirm(false);

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

        {/* ========================= */}
        {/* FREE RUN */}
        {/* ========================= */}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>
            FREE RUN
          </Text>
        </View>

        <View style={styles.gpsBox}>
          <Text style={styles.gpsTitle}>
            RUNNING DISTANCE
          </Text>

          <Text style={styles.gpsValue}>
            {gpsDistance.toFixed(2)} KM
          </Text>

          <Text
            style={[
              styles.gpsStatus,
              gpsStatus === 'GPS ACTIVE' &&
                styles.gpsActive,
              gpsStatus === 'GPS ERROR' &&
                styles.gpsError,
              gpsStatus === 'GPS DENIED' &&
                styles.gpsError,
            ]}
          >
            {gpsStatus}
          </Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>
            {formatTime(seconds)}
          </Text>

          <Text style={styles.timerLabel}>
            RUN TIME
          </Text>
        </View>

        {!running && !finished && (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed &&
                styles.startButtonPressed,
            ]}
            onPress={startRun}
          >
            <Text style={styles.startText}>
              START RUN
            </Text>
          </Pressable>
        )}

        {running && (
          <Pressable
            style={({ pressed }) => [
              styles.endButton,
              pressed &&
                styles.endButtonPressed,
            ]}
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

            <View style={styles.completeStats}>
              <View style={styles.completeStat}>
                <Text
                  style={styles.completeNumber}
                >
                  {gpsDistance.toFixed(2)}
                </Text>

                <Text
                  style={styles.completeLabel}
                >
                  KM
                </Text>
              </View>

              <View style={styles.completeStat}>
                <Text
                  style={styles.completeNumber}
                >
                  {formatTime(seconds)}
                </Text>

                <Text
                  style={styles.completeLabel}
                >
                  TIME
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed &&
                  styles.saveButtonPressed,
              ]}
              onPress={saveRun}
            >
              <Text style={styles.saveText}>
                SAVE RUN
              </Text>
            </Pressable>
          </View>
        )}

        {/* ========================= */}
        {/* LAST 3 RUNS */}
        {/* ========================= */}

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
              <View style={styles.lastRunLeft}>
                <View style={styles.runBadge}>
                  <Text style={styles.runBadgeText}>
                    {index + 1}
                  </Text>
                </View>

                <View>
                  <Text
                    style={styles.lastRunNumber}
                  >
                    RUN {index + 1}
                  </Text>

                  <Text
                    style={styles.lastRunTime}
                  >
                    {formatTime(run.seconds)}
                  </Text>
                </View>
              </View>

              <Text
                style={styles.lastRunDistance}
              >
                {Number(run.distance).toFixed(2)} KM
              </Text>
            </View>
          ))
        )}

        {/* ========================= */}
        {/* STATS */}
        {/* ========================= */}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>
            FREE RUN STATS
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.resetButton,
            pressed &&
              styles.resetButtonPressed,
          ]}
          onPress={resetStats}
          hitSlop={8}
        >
          <Text style={styles.resetText}>
            RESET RUN STATS
          </Text>
        </Pressable>

        {showResetConfirm && (
          <View style={styles.resetConfirmBox}>
            <Text
              style={styles.resetConfirmTitle}
            >
              RESET FREE RUN STATS?
            </Text>

            <Text
              style={styles.resetConfirmDescription}
            >
              This will clear your Free Run
              kilometres, runs, total time,
              personal bests and last 3 runs.
              It will also clear the Free Run
              figures shown on the Progress page.
            </Text>

            <View
              style={styles.resetConfirmButtons}
            >
              <Pressable
                style={styles.cancelResetButton}
                onPress={() =>
                  setShowResetConfirm(false)
                }
              >
                <Text
                  style={styles.cancelResetText}
                >
                  CANCEL
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.confirmResetButton
                }
                onPress={confirmResetStats}
              >
                <Text
                  style={styles.confirmResetText}
                >
                  RESET
                </Text>
              </Pressable>
            </View>
          </View>
        )}

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

        {/* ========================= */}
        {/* PERSONAL BESTS */}
        {/* ========================= */}

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

        <Text style={styles.footer}>
          KEEP MOVING FORWARD
        </Text>
      </ScrollView>

      {/* ========================= */}
      {/* BOTTOM NAV */}
      {/* ========================= */}

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
          onPress={() =>
            router.push('/weeks')
          }
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
          onPress={() =>
            router.push('/progress')
          }
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
          onPress={() =>
            router.push('/free-run')
          }
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
          onPress={() =>
            router.push('/community')
          }
        >
          <Text style={styles.navIcon}>
            👥
          </Text>

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
    backgroundColor: BLACK,
  },

  container: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 105,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },

  heading: {
    color: WHITE,
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
    color: ORANGE,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 5,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  sectionHeading: {
    width: '100%',
    backgroundColor: ORANGE,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
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
    color: WHITE,
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

  gpsBox: {
    width: '100%',
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },

  gpsTitle: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  gpsValue: {
    color: ORANGE,
    fontSize: 38,
    fontWeight: '900',
    marginTop: 2,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  gpsStatus: {
    color: GREY,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 3,
  },

  gpsActive: {
    color: GREEN,
  },

  gpsError: {
    color: RED,
  },

  timerBox: {
    width: '100%',
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 13,
    marginTop: 10,
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
    color: ORANGE,
    fontSize: 48,
    fontWeight: '900',
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  timerLabel: {
    color: GREY,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: -2,
  },

  startButton: {
    width: '100%',
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 17,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 7,
  },

  startButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  startText: {
    color: WHITE,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  endButton: {
    width: '100%',
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 17,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 7,
  },

  endButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  endText: {
    color: WHITE,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  saveBox: {
    width: '100%',
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },

  saveTitle: {
    color: WHITE,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  completeStats: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },

  completeStat: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  completeNumber: {
    color: ORANGE,
    fontSize: 25,
    fontWeight: '900',
  },

  completeLabel: {
    color: GREY,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },

  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.45,
    shadowRadius: 4,
    elevation: 5,
  },

  saveButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  saveText: {
    color: WHITE,
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

  lastRunBox: {
    width: '100%',
    minHeight: 68,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingHorizontal: 13,
    marginBottom: 9,
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

  lastRunLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  runBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  runBadgeText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '900',
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  lastRunNumber: {
    color: GREY,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  lastRunTime: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 1,
  },

  lastRunDistance: {
    color: ORANGE,
    fontSize: 20,
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
    minHeight: 62,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  resetButton: {
    width: '100%',
    backgroundColor: RED,
    borderRadius: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 4,
  },

  resetButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  resetText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 2,
  },

  resetConfirmBox: {
    width: '100%',
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: RED,
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  resetConfirmTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  resetConfirmDescription: {
    color: GREY,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 13,
  },

  resetConfirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelResetButton: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 10,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelResetText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  confirmResetButton: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 10,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmResetText: {
    color: WHITE,
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
    gap: 9,
  },

  stat: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  number: {
    color: ORANGE,
    fontSize: 21,
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
    color: WHITE,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 3,
    textAlign: 'center',
  },

  pbBox: {
    width: '100%',
    minHeight: 74,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingHorizontal: 13,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  trophy: {
    fontSize: 24,
    marginRight: 9,
  },

  pbSmall: {
    color: GREY,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },

  pbTitle: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  pbValue: {
    color: ORANGE,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'right',
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
    backgroundColor: BLACK,
    borderTopWidth: 2,
    borderTopColor: ORANGE,
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
    color: WHITE,
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
    color: WHITE,
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