import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  getRunnerName,
  saveLeaderboardRun,
  setRunnerName,
} from '../lib/leaderboard';

const FREE_RUNS_KEY =
  'zero_to_thirty_free_runs';

const PROGRESS_STORAGE_KEY =
  'zero_to_thirty_progress';

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

export default function FreeRunScreen() {
  const router = useRouter();

  const [seconds, setSeconds] =
    useState(0);

  const [running, setRunning] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [gpsDistance, setGpsDistance] =
    useState(0);

  const [gpsStatus, setGpsStatus] =
    useState('GPS READY');

  const [name, setName] =
    useState('');

  const [manualDistance, setManualDistance] =
    useState('');

  const [saveError, setSaveError] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [savedRuns, setSavedRuns] =
    useState<any[]>([]);

  const locationSubscription =
    useRef<Location.LocationSubscription | null>(
      null
    );

  const browserWatchId =
    useRef<number | null>(null);

  const lastLatitude =
    useRef<number | null>(null);

  const lastLongitude =
    useRef<number | null>(null);

  const totalDistanceRef =
    useRef(0);

  const timerStartRef =
    useRef<number | null>(null);

  const accumulatedSecondsRef =
    useRef(0);

  useEffect(() => {
    loadSavedData();
  }, []);

  async function loadSavedData() {
    try {
      const savedName =
        await getRunnerName();

      if (savedName) {
        setName(savedName);
      }

      const saved =
        await AsyncStorage.getItem(
          FREE_RUNS_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setSavedRuns(parsed);
        }
      }
    } catch (error) {
      console.log(
        'Could not load free run data:',
        error
      );
    }
  }

  useEffect(() => {
    if (!running || finished) {
      return;
    }

    const updateTimer = () => {
      if (
        timerStartRef.current === null
      ) {
        return;
      }

      const currentSeconds =
        accumulatedSecondsRef.current +
        Math.floor(
          (Date.now() -
            timerStartRef.current) /
            1000
        );

      setSeconds(
        currentSeconds
      );
    };

    updateTimer();

    const timer =
      setInterval(
        updateTimer,
        250
      );

    return () => {
      clearInterval(timer);
    };
  }, [running, finished]);

  useEffect(() => {
    return () => {
      stopGPS();
    };
  }, []);

  function stopGPS() {
    if (
      locationSubscription.current
    ) {
      locationSubscription.current.remove();

      locationSubscription.current =
        null;
    }

    if (
      browserWatchId.current !== null &&
      typeof navigator !==
        'undefined' &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(
        browserWatchId.current
      );

      browserWatchId.current =
        null;
    }
  }

  function processGPSPosition(
    latitude: number,
    longitude: number,
    accuracy:
      | number
      | null
      | undefined
  ) {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    if (
      accuracy != null &&
      Number.isFinite(accuracy) &&
      accuracy > 100
    ) {
      setGpsStatus(
        'GPS SEARCHING'
      );

      return;
    }

    if (
      lastLatitude.current === null ||
      lastLongitude.current === null
    ) {
      lastLatitude.current =
        latitude;

      lastLongitude.current =
        longitude;

      setGpsStatus(
        'GPS TRACKING'
      );

      return;
    }

    const movement =
      calculateDistance(
        lastLatitude.current,
        lastLongitude.current,
        latitude,
        longitude
      );

    if (
      movement >= 0.001 &&
      movement <= 0.2
    ) {
      totalDistanceRef.current +=
        movement;

      setGpsDistance(
        totalDistanceRef.current
      );
    }

    lastLatitude.current =
      latitude;

    lastLongitude.current =
      longitude;

    setGpsStatus(
      'GPS TRACKING'
    );
  }

  async function startGPS() {
    try {
      setGpsStatus(
        'REQUESTING GPS'
      );

      if (
        totalDistanceRef.current === 0
      ) {
        lastLatitude.current =
          null;

        lastLongitude.current =
          null;

        setGpsDistance(0);
      }

      stopGPS();

      if (
        Platform.OS === 'web' &&
        typeof navigator !==
          'undefined' &&
        navigator.geolocation
      ) {
        setGpsStatus(
          'GPS CONNECTING'
        );

        navigator.geolocation.getCurrentPosition(
          position => {
            processGPSPosition(
              position.coords.latitude,
              position.coords.longitude,
              position.coords.accuracy
            );
          },
          error => {
            console.error(
              'Browser GPS initial error:',
              error
            );

            if (
              error.code === 1
            ) {
              setGpsStatus(
                'GPS DENIED'
              );
            } else if (
              error.code === 2
            ) {
              setGpsStatus(
                'GPS UNAVAILABLE'
              );
            } else if (
              error.code === 3
            ) {
              setGpsStatus(
                'GPS TIMEOUT'
              );
            } else {
              setGpsStatus(
                'GPS ERROR'
              );
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
          }
        );

        browserWatchId.current =
          navigator.geolocation.watchPosition(
            position => {
              processGPSPosition(
                position.coords.latitude,
                position.coords.longitude,
                position.coords.accuracy
              );
            },
            error => {
              console.error(
                'Browser GPS watch error:',
                error
              );

              if (
                error.code === 1
              ) {
                setGpsStatus(
                  'GPS DENIED'
                );
              } else if (
                error.code === 2
              ) {
                setGpsStatus(
                  'GPS UNAVAILABLE'
                );
              } else if (
                error.code === 3
              ) {
                setGpsStatus(
                  'GPS SEARCHING'
                );
              } else {
                setGpsStatus(
                  'GPS ERROR'
                );
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 30000,
              maximumAge: 0,
            }
          );

        setGpsStatus(
          'GPS SEARCHING'
        );

        return true;
      }

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setGpsStatus(
          'TURN ON LOCATION'
        );

        return false;
      }

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (
        permission.status !==
        'granted'
      ) {
        setGpsStatus(
          'GPS DENIED'
        );

        return false;
      }

      locationSubscription.current =
        await Location.watchPositionAsync(
          {
            accuracy:
              Location.Accuracy.BestForNavigation,

            distanceInterval: 1,

            timeInterval: 1000,
          },

          location => {
            processGPSPosition(
              location.coords.latitude,
              location.coords.longitude,
              location.coords.accuracy
            );
          }
        );

      setGpsStatus(
        'GPS SEARCHING'
      );

      return true;
    } catch (error) {
      console.error(
        'GPS START ERROR:',
        error
      );

      setGpsStatus(
        'GPS ERROR'
      );

      return false;
    }
  }

  async function toggleRun() {
    if (running) {
      if (
        timerStartRef.current !==
        null
      ) {
        accumulatedSecondsRef.current +=
          Math.floor(
            (Date.now() -
              timerStartRef.current) /
              1000
          );

        timerStartRef.current =
          null;
      }

      setSeconds(
        accumulatedSecondsRef.current
      );

      setRunning(false);

      stopGPS();

      setGpsStatus(
        'GPS PAUSED'
      );

      return;
    }

    const gpsStarted =
      await startGPS();

    if (!gpsStarted) {
      return;
    }

    timerStartRef.current =
      Date.now();

    setRunning(true);
  }

  function finishRun() {
    if (
      timerStartRef.current !==
      null
    ) {
      accumulatedSecondsRef.current +=
        Math.floor(
          (Date.now() -
            timerStartRef.current) /
            1000
        );

      timerStartRef.current =
        null;
    }

    setSeconds(
      accumulatedSecondsRef.current
    );

    setRunning(false);

    stopGPS();

    setGpsStatus(
      'GPS COMPLETE'
    );

    setFinished(true);
  }

  async function saveRun() {
    if (saving) {
      return;
    }

    setSaveError('');

    const cleanName =
      name.trim();

    if (
      cleanName.length < 2
    ) {
      setSaveError(
        'Please enter your name.'
      );

      return;
    }

    const enteredDistance =
      Number.parseFloat(
        manualDistance
      ) || 0;

    /*
     * IMPORTANT:
     * The leaderboard uses the manually
     * entered KM, exactly like Free Walk
     * uses the manually entered steps.
     *
     * GPS remains visible and is saved locally,
     * but it does NOT determine the leaderboard
     * value.
     */
    if (
      enteredDistance <= 0
    ) {
      setSaveError(
        'Please enter the distance in KM.'
      );

      return;
    }

    setSaving(true);

    try {
      await setRunnerName(
        cleanName
      );

      const saved =
        await AsyncStorage.getItem(
          FREE_RUNS_KEY
        );

      let runs: any[] = [];

      if (saved) {
        try {
          const parsed =
            JSON.parse(saved);

          if (
            Array.isArray(parsed)
          ) {
            runs = parsed;
          }
        } catch {
          runs = [];
        }
      }

      const finalDistance =
        Number(
          enteredDistance.toFixed(
            2
          )
        );

      const newRun = {
        id: `${Date.now()}`,

        type: 'free',

        date:
          new Date().toISOString(),

        durationSeconds:
          seconds,

        distance:
          finalDistance,

        gpsDistance:
          Number(
            gpsDistance.toFixed(
              2
            )
          ),

        manualDistance:
          finalDistance,

        displayName:
          cleanName,
      };

      runs.push(
        newRun
      );

      await AsyncStorage.setItem(
        FREE_RUNS_KEY,
        JSON.stringify(
          runs
        )
      );

      setSavedRuns(runs);

      console.log(
        'FREE RUN SAVED LOCALLY:',
        newRun
      );

      /*
       * SAME LEADERBOARD METHOD AS THE
       * PROGRAMMED RUNS.
       *
       * MANUAL KM is deliberately sent here.
       */
      await saveLeaderboardRun({
        km: finalDistance,
        runType: 'free',
        weekNumber: 0,
        runNumber: 0,
      });

      console.log(
        'FREE RUN LEADERBOARD SAVE SUCCESS:',
        finalDistance
      );

      router.replace(
        '/leaderboard'
      );
    } catch (error: any) {
      console.error(
        'FREE RUN SAVE ERROR:',
        error
      );

      setSaveError(
        `Leaderboard save failed: ${
          error?.message ||
          'Unknown error'
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRun(
    id: string
  ) {
    try {
      const updated =
        savedRuns.filter(
          run =>
            String(run.id) !==
            String(id)
        );

      setSavedRuns(updated);

      await AsyncStorage.setItem(
        FREE_RUNS_KEY,
        JSON.stringify(
          updated
        )
      );
    } catch (error) {
      console.error(
        'DELETE FREE RUN ERROR:',
        error
      );
    }
  }

  async function deleteAllFreeRuns() {
    const confirmed =
      typeof window !==
        'undefined'
        ? window.confirm(
            'DELETE ALL SAVED FREE RUNS FROM THIS PHONE? This will not delete leaderboard entries.'
          )
        : true;

    if (!confirmed) {
      return;
    }

    try {
      await AsyncStorage.removeItem(
        FREE_RUNS_KEY
      );

      setSavedRuns([]);

      setSaveError('');

      console.log(
        'ALL FREE RUN DATA DELETED'
      );
    } catch (error) {
      console.error(
        'DELETE ALL FREE RUNS ERROR:',
        error
      );

      setSaveError(
        'Could not delete saved free runs.'
      );
    }
  }

  function quitRun() {
    setRunning(false);

    if (
      timerStartRef.current !==
      null
    ) {
      accumulatedSecondsRef.current +=
        Math.floor(
          (Date.now() -
            timerStartRef.current) /
            1000
        );

      timerStartRef.current =
        null;
    }

    stopGPS();

    router.back();
  }

  function formatTime(
    value: number
  ) {
    const hours =
      Math.floor(
        value / 3600
      );

    const minutes =
      Math.floor(
        (value % 3600) / 60
      );

    const secs =
      value % 60;

    if (hours > 0) {
      return (
        String(hours).padStart(
          2,
          '0'
        ) +
        ':' +
        String(minutes).padStart(
          2,
          '0'
        ) +
        ':' +
        String(secs).padStart(
          2,
          '0'
        )
      );
    }

    return (
      String(minutes).padStart(
        2,
        '0'
      ) +
      ':' +
      String(secs).padStart(
        2,
        '0'
      )
    );
  }

  const enteredDistance =
    Number.parseFloat(
      manualDistance
    ) || 0;

  const totalRunKm =
    savedRuns.reduce(
      (total, run) =>
        total +
        (Number(run.distance) ||
          0),
      0
    );

  const totalRunSeconds =
    savedRuns.reduce(
      (total, run) =>
        total +
        (Number(
          run.durationSeconds
        ) || 0),
      0
    );

  const longestRun =
    savedRuns.length > 0
      ? Math.max(
          ...savedRuns.map(
            run =>
              Number(
                run.distance
              ) || 0
          )
        )
      : 0;

  const completedDistance =
    enteredDistance;

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View
          style={styles.header}
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={quitRun}
          >
            <Text
              style={
                styles.backText
              }
            >
              {'<'}
            </Text>
          </Pressable>

          <View
            style={
              styles.headerCentre
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              FREE RUN
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              ZERO TO THIRTY
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View
            style={
              styles.introCard
            }
          >
            <Text
              style={
                styles.introTitle
              }
            >
              FREE RUN
            </Text>

            <Text
              style={
                styles.introText
              }
            >
              No programme. No target. Just run.
            </Text>
          </View>

          <View
            style={
              styles.timerCard
            }
          >
            <Text
              style={
                styles.timerLabel
              }
            >
              RUN TIME
            </Text>

            <Text
              style={styles.timer}
            >
              {formatTime(
                seconds
              )}
            </Text>
          </View>

          <View
            style={
              styles.distanceCard
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              GPS DISTANCE
            </Text>

            <Text
              style={
                styles.distanceNumber
              }
            >
              {gpsDistance.toFixed(
                2
              )}{' '}
              KM
            </Text>

            <Text
              style={
                styles.gpsStatus
              }
            >
              {gpsStatus}
            </Text>
          </View>

          {!finished && (
            <View
              style={
                styles.stepsLiveCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                LEADERBOARD DISTANCE
              </Text>

              <Text
                style={
                  styles.stepsWaiting
                }
              >
                ENTER AFTER RUN
              </Text>

              <Text
                style={
                  styles.stepsLiveStatus
                }
              >
                USE THE DISTANCE FROM YOUR PHONE OR WATCH
              </Text>
            </View>
          )}

          {!finished && (
            <Pressable
              style={[
                styles.mainButton,
                running &&
                  styles.pauseButton,
              ]}
              onPress={
                toggleRun
              }
            >
              <Text
                style={
                  styles.mainButtonText
                }
              >
                {running
                  ? 'PAUSE RUN'
                  : 'START RUN'}
              </Text>
            </Pressable>
          )}

          {running && (
            <View
              style={
                styles.finishArea
              }
            >
              <Text
                style={
                  styles.finishHint
                }
              >
                FINISHED YOUR RUN?
              </Text>

              <Pressable
                style={
                  styles.finishButton
                }
                onPress={
                  finishRun
                }
              >
                <Text
                  style={
                    styles.finishIcon
                  }
                >
                  ✓
                </Text>

                <Text
                  style={
                    styles.finishButtonText
                  }
                >
                  FINISH RUN
                </Text>

                <Text
                  style={
                    styles.finishSubText
                  }
                >
                  TAP HERE TO FINISH AND SAVE
                </Text>
              </Pressable>
            </View>
          )}

          {finished && (
            <View
              style={
                styles.completedCard
              }
            >
              <Text
                style={
                  styles.completedTitle
                }
              >
                RUN COMPLETE
              </Text>

              <Text
                style={
                  styles.completedDistance
                }
              >
                {gpsDistance > 0
                  ? gpsDistance.toFixed(
                      2
                    )
                  : '0.00'}{' '}
                KM
              </Text>

              <Text
                style={
                  styles.completedTime
                }
              >
                {formatTime(
                  seconds
                )}
              </Text>

              <Text
                style={
                  styles.completedMessage
                }
              >
                GREAT WORK. ENTER YOUR DISTANCE BELOW.
              </Text>
            </View>
          )}

          {finished && (
            <View
              style={
                styles.inputCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                ADD YOUR DETAILS
              </Text>

              <Text
                style={
                  styles.inputHelp
                }
              >
                Enter the distance shown on your phone or watch. This is the KM that will be added to this week's leaderboard.
              </Text>

              <Text
                style={
                  styles.inputLabel
                }
              >
                YOUR NAME
              </Text>

              <TextInput
                value={name}
                onChangeText={
                  setName
                }
                placeholder="Enter your name"
                placeholderTextColor="#666666"
                maxLength={30}
                autoCapitalize="words"
                style={
                  styles.input
                }
              />

              <Text
                style={
                  styles.inputLabel
                }
              >
                YOUR DISTANCE (KM)
              </Text>

              <TextInput
                value={
                  manualDistance
                }
                onChangeText={
                  setManualDistance
                }
                placeholder={
                  gpsDistance > 0
                    ? gpsDistance.toFixed(
                        2
                      )
                    : 'e.g. 5.2'
                }
                placeholderTextColor="#666666"
                keyboardType="decimal-pad"
                style={
                  styles.stepsInput
                }
              />

              <View
                style={
                  styles.summaryBox
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  NAME
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {name.trim() ||
                    '—'}
                </Text>

                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  LEADERBOARD KM
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {completedDistance >
                  0
                    ? completedDistance.toFixed(
                        2
                      )
                    : '—'}{' '}
                  KM
                </Text>

                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  GPS DISTANCE
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {gpsDistance.toFixed(
                    2
                  )}{' '}
                  KM
                </Text>

                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  RUN TIME
                </Text>

                <Text
                  style={
                    styles.summaryValue
                  }
                >
                  {formatTime(
                    seconds
                  )}
                </Text>
              </View>

              {saveError ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {saveError}
                </Text>
              ) : null}

              <Pressable
                style={[
                  styles.saveButton,
                  saving &&
                    styles.saveButtonDisabled,
                ]}
                onPress={
                  saveRun
                }
                disabled={
                  saving
                }
              >
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {saving
                    ? 'SAVING...'
                    : 'SAVE FREE RUN'}
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={
              styles.leaderboardButton
            }
            onPress={() =>
              router.push(
                '/leaderboard'
              )
            }
          >
            <View
              style={
                styles.leaderboardIconCircle
              }
            >
              <Text
                style={
                  styles.leaderboardIcon
                }
              >
                🏆
              </Text>
            </View>

            <Text
              style={
                styles.leaderboardText
              }
            >
              {finished
                ? 'RUN TO LEADERBOARD'
                : 'WEEKLY KM LEADERBOARD'}
            </Text>
          </Pressable>

          <View
            style={
              styles.statsCard
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              FREE RUN STATS
            </Text>

            <View
              style={
                styles.statsRow
              }
            >
              <View
                style={
                  styles.statBox
                }
              >
                <Text
                  style={
                    styles.statValue
                  }
                >
                  {totalRunKm.toFixed(
                    2
                  )}
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  TOTAL KM
                </Text>
              </View>

              <View
                style={
                  styles.statBox
                }
              >
                <Text
                  style={
                    styles.statValue
                  }
                >
                  {savedRuns.length}
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  RUNS
                </Text>
              </View>

              <View
                style={
                  styles.statBox
                }
              >
                <Text
                  style={
                    styles.statValue
                  }
                >
                  {formatTime(
                    totalRunSeconds
                  )}
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  TIME
                </Text>
              </View>
            </View>

            <View
              style={
                styles.bestRow
              }
            >
              <Text
                style={
                  styles.bestLabel
                }
              >
                LONGEST RUN
              </Text>

              <Text
                style={
                  styles.bestValue
                }
              >
                {longestRun.toFixed(
                  2
                )}{' '}
                KM
              </Text>
            </View>
          </View>

          {savedRuns.length > 0 && (
            <View
              style={
                styles.historyCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                RUN HISTORY
              </Text>

              {savedRuns
  .slice()
  .reverse()
  .slice(0, 3)
  .map(run => (
                  <View
                    key={String(
                      run.id
                    )}
                    style={
                      styles.historyItem
                    }
                  >
                    <View
                      style={
                        styles.historyInfo
                      }
                    >
                      <Text
                        style={
                          styles.historyDistance
                        }
                      >
                        {Number(
                          run.distance ||
                            0
                        ).toFixed(
                          2
                        )}{' '}
                        KM
                      </Text>

                      <Text
                        style={
                          styles.historyDate
                        }
                      >
                        {run.date
                          ? new Date(
                              run.date
                            ).toLocaleDateString()
                          : ''}
                        {'  •  '}
                        {formatTime(
                          Number(
                            run.durationSeconds ||
                              0
                          )
                        )}
                      </Text>
                    </View>

                    <Pressable
                      style={
                        styles.historyDelete
                      }
                      onPress={() =>
                        deleteRun(
                          run.id
                        )
                      }
                    >
                      <Text
                        style={
                          styles.historyDeleteText
                        }
                      >
                        DELETE
                      </Text>
                    </Pressable>
                  </View>
                ))}
            </View>
          )}

          <Pressable
            style={
              styles.deleteButton
            }
            onPress={
              deleteAllFreeRuns
            }
          >
            <Text
              style={
                styles.deleteButtonText
              }
            >
              DELETE ALL FREE RUN DATA
            </Text>

            <Text
              style={
                styles.deleteButtonSubText
              }
            >
              Removes saved runs from this phone only
            </Text>
          </Pressable>

          {!finished && (
            <Pressable
              style={
                styles.quitButton
              }
              onPress={
                quitRun
              }
            >
              <Text
                style={
                  styles.quitText
                }
              >
                QUIT RUN
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },

  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  header: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#111111',
    borderBottomWidth: 2,
    borderBottomColor: '#FF8C00',
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  headerCentre: {
    flex: 1,
    alignItems: 'center',
    marginRight: 48,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },

  headerSubtitle: {
    color: '#FF8C00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 3,
  },

  scrollContent: {
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingBottom: 50,
  },

  introCard: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },

  introTitle: {
    color: '#FF8C00',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },

  introText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 7,
    textAlign: 'center',
  },

  timerCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 22,
    marginTop: 12,
  },

  timerLabel: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  timer: {
    color: '#FFFFFF',
    fontSize: 68,
    fontWeight: '900',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  distanceCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 12,
  },

  sectionTitle: {
    color: '#FF8C00',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },

  distanceNumber: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 4,
  },

  gpsStatus: {
    color: '#FF8C00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
  },

  stepsLiveCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 18,
    marginTop: 12,
  },

  stepsWaiting: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },

  stepsLiveStatus: {
    color: '#FF8C00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 5,
    textAlign: 'center',
  },

  mainButton: {
    width: '100%',
    minHeight: 70,
    backgroundColor: '#FF8C00',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    borderWidth: 2,
    borderColor: '#FFB347',
    elevation: 8,
  },

  pauseButton: {
    backgroundColor: '#333333',
    borderColor: '#FF8C00',
  },

  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },

  finishArea: {
    marginTop: 16,
  },

  finishHint: {
    color: '#FF8C00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 7,
  },

  finishButton: {
    width: '100%',
    minHeight: 82,
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#FF8C00',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  finishIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 1,
  },

  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  finishSubText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 3,
  },

  completedCard: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 15,
    marginTop: 15,
  },

  completedTitle: {
    color: '#FF8C00',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },

  completedDistance: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    marginTop: 5,
  },

  completedTime: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },

  completedMessage: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center',
  },

  inputCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    padding: 18,
    marginTop: 15,
  },

  inputHelp: {
    color: '#AAAAAA',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },

  inputLabel: {
    color: '#FF8C00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    minHeight: 52,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  stepsInput: {
    minHeight: 58,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },

  summaryBox: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 12,
    alignItems: 'center',
  },

  summaryLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
  },

  summaryValue: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 2,
  },

  errorText: {
    color: '#FF5555',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 15,
  },

  saveButton: {
    width: '100%',
    minHeight: 64,
    backgroundColor: '#FF8C00',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderWidth: 2,
    borderColor: '#FFB347',
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  leaderboardButton: {
    width: '100%',
    minHeight: 62,
    backgroundColor: '#111111',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 18,
    borderWidth: 2,
    borderColor: '#FF8C00',
  },

  leaderboardIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  leaderboardIcon: {
    fontSize: 24,
  },

  leaderboardText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  statsCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    padding: 18,
    marginTop: 15,
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 15,
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  statLabel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },

  bestRow: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginTop: 15,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bestLabel: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  bestValue: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: '900',
  },

  historyCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    padding: 18,
    marginTop: 15,
  },

  historyItem: {
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  historyInfo: {
    flex: 1,
  },

  historyDistance: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  historyDate: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  historyDelete: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  historyDeleteText: {
    color: '#FF6666',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  deleteButton: {
    width: '100%',
    minHeight: 58,
    backgroundColor: '#111111',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#663333',
    paddingVertical: 10,
  },

  deleteButtonText: {
    color: '#FF6666',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  deleteButtonSubText: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },

  quitButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#111111',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#444444',
  },

  quitText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});