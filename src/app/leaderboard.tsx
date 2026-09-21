import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getLeaderboardId,
  getRunnerName,
  setRunnerName,
} from '../lib/leaderboard';

const PROGRESS_KEY =
  'zero_to_thirty_progress';

const SUPABASE_URL =
  'https://cfvhdjkgnwvwpftgmddt.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdmhkamtnbnd2d3BmdGdtZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzAxMjYsImV4cCI6MjEwNDAwNjEyNn0.GMGAvrYc1y75ldGEPd5DqDzyg0cDWLm9CjHhJMNdjfU';

type ProgressData = {
  completedRuns?: number;
  completedWeeks?: number;
  extraRuns?: number;
  extraKm?: number;
  totalKm?: number;
};

type LeaderboardRun = {
  id: number;
  user_id: string;
  runner_name: string;
  km: number;
  week_number: number;
  run_number: number;
  run_type: 'programme' | 'free';
  run_date: string;
  recorded_at: string;
};

type RunnerTotal = {
  user_id: string;
  runner_name: string;
  km: number;
  runs: number;
  latestDate: string;
};

export default function LeaderboardScreen() {
  const router = useRouter();

  const [progress, setProgress] =
    useState<ProgressData>({});

  const [activeTab, setActiveTab] =
    useState<'week' | 'all'>('week');

  const [runs, setRuns] =
    useState<LeaderboardRun[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [myUserId, setMyUserId] =
    useState<string | null>(null);

  const [myName, setMyName] =
    useState<string | null>(null);

  const [nameInput, setNameInput] =
    useState('');

  const [showNameEditor, setShowNameEditor] =
    useState(false);

  const [savingName, setSavingName] =
    useState(false);

  const [nameError, setNameError] =
    useState('');

  const loadProgress =
    useCallback(async () => {
      try {
        const stored =
          await AsyncStorage.getItem(
            PROGRESS_KEY
          );

        if (stored) {
          setProgress(
            JSON.parse(stored)
          );
        }
      } catch (error) {
        console.log(
          'Leaderboard progress load error:',
          error
        );
      }
    }, []);

  const loadIdentity =
    useCallback(async () => {
      try {
        const id =
          await getLeaderboardId();

        const name =
          await getRunnerName();

        setMyUserId(id);
        setMyName(name);

        if (name) {
          setNameInput(name);
        }
      } catch (error) {
        console.log(
          'Leaderboard identity error:',
          error
        );
      }
    }, []);

  const loadLeaderboard =
    useCallback(async () => {
      try {
        setLoading(true);

        const id =
          await getLeaderboardId();

        setMyUserId(id);

        const response =
          await fetch(
            `${SUPABASE_URL}/rest/v1/leaderboard_runs?select=id,user_id,runner_name,km,week_number,run_number,run_type,run_date,recorded_at&order=run_date.desc,recorded_at.desc`,
            {
              method: 'GET',
              headers: {
                apikey:
                  SUPABASE_PUBLISHABLE_KEY,
                Authorization:
                  `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
                Accept:
                  'application/json',
              },
            }
          );

        const text =
          await response.text();

        console.log(
          'LEADERBOARD READ STATUS:',
          response.status
        );

        console.log(
          'LEADERBOARD READ DATA:',
          text
        );

        if (!response.ok) {
          throw new Error(
            `Leaderboard read failed: ${response.status} ${text}`
          );
        }

        const data =
          text
            ? JSON.parse(text)
            : [];

        if (
          Array.isArray(data)
        ) {
          setRuns(
            data as LeaderboardRun[]
          );
        } else {
          setRuns([]);
        }
      } catch (error) {
        console.log(
          'Leaderboard load error:',
          error
        );

        setRuns([]);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadProgress();
    loadIdentity();
    loadLeaderboard();
  }, [
    loadProgress,
    loadIdentity,
    loadLeaderboard,
  ]);

  const handleSaveName =
    async () => {
      const cleanName =
        nameInput
          .trim()
          .slice(0, 30);

      if (!cleanName) {
        setNameError(
          'PLEASE ENTER A NAME'
        );
        return;
      }

      try {
        setSavingName(true);
        setNameError('');

        const savedName =
          await setRunnerName(
            cleanName
          );

        setMyName(savedName);
        setNameInput(savedName);
        setShowNameEditor(false);

        await loadLeaderboard();
      } catch (error) {
        console.log(
          'Save leaderboard name error:',
          error
        );

        setNameError(
          'COULD NOT SAVE NAME'
        );
      } finally {
        setSavingName(false);
      }
    };

  const getWeekStart =
    () => {
      const now =
        new Date();

      const day =
        now.getDay();

      const diff =
        day === 0
          ? -6
          : 1 - day;

      const monday =
        new Date(now);

      monday.setDate(
        now.getDate() + diff
      );

      monday.setHours(
        0,
        0,
        0,
        0
      );

      return monday;
    };

  const weekStart =
    getWeekStart();

  const thisWeekRuns =
    runs.filter((run) => {
      const date =
        new Date(
          `${run.run_date}T00:00:00`
        );

      return date >= weekStart;
    });

  const displayedRuns =
  (activeTab === 'week'
    ? thisWeekRuns
    : runs
  ).slice(0, 3);

  const runnerMap =
    new Map<
      string,
      RunnerTotal
    >();

  displayedRuns.forEach(
    (run) => {
      const existing =
        runnerMap.get(
          run.user_id
        );

      if (existing) {
        existing.km +=
          Number(run.km);

        existing.runs += 1;

        if (
          run.run_date >
          existing.latestDate
        ) {
          existing.latestDate =
            run.run_date;
        }

        if (
          run.runner_name &&
          run.runner_name !==
            'Runner'
        ) {
          existing.runner_name =
            run.runner_name;
        }
      } else {
        runnerMap.set(
          run.user_id,
          {
            user_id:
              run.user_id,

            runner_name:
              run.runner_name ||
              'RUNNER',

            km:
              Number(run.km),

            runs: 1,

            latestDate:
              run.run_date,
          }
        );
      }
    }
  );

  const rankings =
    Array.from(
      runnerMap.values()
    )
      .map((runner) => ({
        ...runner,
        km: Number(
          runner.km.toFixed(2)
        ),
      }))
      .sort((a, b) => {
        if (
          b.km !== a.km
        ) {
          return b.km - a.km;
        }

        return (
          b.runs -
          a.runs
        );
      });

  const topTen =
    rankings.slice(0, 10);

  const myRankingIndex =
    myUserId
      ? rankings.findIndex(
          (runner) =>
            runner.user_id ===
            myUserId
        )
      : -1;

  const myPosition =
    myRankingIndex >= 0
      ? myRankingIndex + 1
      : null;

  const myRunner =
    myRankingIndex >= 0
      ? rankings[
          myRankingIndex
        ]
      : null;

  const programmedRuns =
    progress.completedRuns ||
    0;

  const freeRuns =
    progress.extraRuns ||
    0;

  const totalRuns =
    programmedRuns +
    freeRuns;

  const programmeKm =
    Number(
      progress.totalKm || 0
    );

  const freeRunKm =
    Number(
      progress.extraKm || 0
    );

  const totalKm =
    Number(
      (
        programmeKm +
        freeRunKm
      ).toFixed(2)
    );

  const formatDate =
    (dateString: string) => {
      if (!dateString) {
        return '—';
      }

      const date =
        new Date(
          `${dateString}T00:00:00`
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return dateString;
      }

      return date.toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      );
    };

  const getRunLabel =
    (run: LeaderboardRun) => {
      if (
        run.run_type ===
        'free'
      ) {
        return 'FREE RUN';
      }

      return `ZERO TO THIRTY • W${run.week_number} R${run.run_number}`;
    };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={styles.header}
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.backButtonPressed,
            ]}
          >
            <Text
              style={styles.backText}
            >
              ‹
            </Text>
          </Pressable>

          <View
            style={
              styles.headerTitleWrap
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              LEADERBOARD
            </Text>

            <Text
              style={
                styles.headerSubTitle
              }
            >
              ZERO TO THIRTY
            </Text>
          </View>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        <View
          style={styles.heroCard}
        >
          <View
            style={styles.heroGlow}
          />

          <Text
            style={styles.trophy}
          >
            🏆
          </Text>

          <Text
            style={styles.heroTitle}
          >
            EARN YOUR PLACE
          </Text>

          <Text
            style={styles.heroText}
          >
            Every run counts. Every
            kilometre matters.
          </Text>
        </View>

        <View
          style={styles.nameCard}
        >
          {!myName ||
          showNameEditor ? (
            <>
              <Text
                style={
                  styles.nameTitle
                }
              >
                CHOOSE YOUR
                LEADERBOARD NAME
              </Text>

              <Text
                style={
                  styles.nameSubtitle
                }
              >
                This is the name other
                runners will see.
              </Text>

              <TextInput
                value={nameInput}
                onChangeText={(text) => {
                  setNameInput(
                    text.slice(0, 30)
                  );
                  setNameError('');
                }}
                placeholder="Enter your name"
                placeholderTextColor="#666666"
                maxLength={30}
                autoCapitalize="words"
                autoCorrect={false}
                style={
                  styles.nameInput
                }
              />

              {nameError ? (
                <Text
                  style={
                    styles.nameError
                  }
                >
                  {nameError}
                </Text>
              ) : null}

              <Pressable
                onPress={
                  handleSaveName
                }
                disabled={savingName}
                style={({ pressed }) => [
                  styles.saveNameButton,
                  pressed &&
                    styles.saveNamePressed,
                  savingName &&
                    styles.saveNameDisabled,
                ]}
              >
                <View
                  style={
                    styles.buttonHighlight
                  }
                />

                {savingName ? (
                  <ActivityIndicator
                    size="small"
                    color="#f8f8f8"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveNameText
                    }
                  >
                    SAVE NAME
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <View
              style={
                styles.currentNameRow
              }
            >
              <View
                style={
                  styles.currentNameInfo
                }
              >
                <Text
                  style={
                    styles.smallLabel
                  }
                >
                  YOUR LEADERBOARD NAME
                </Text>

                <Text
                  style={
                    styles.currentName
                  }
                  numberOfLines={1}
                >
                  {myName}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setNameInput(
                    myName
                  );
                  setNameError('');
                  setShowNameEditor(
                    true
                  );
                }}
                style={({ pressed }) => [
                  styles.changeNameButton,
                  pressed &&
                    styles.changeNamePressed,
                ]}
              >
                <Text
                  style={
                    styles.changeNameText
                  }
                >
                  CHANGE
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View
          style={styles.tabs}
        >
          <Pressable
            onPress={() =>
              setActiveTab('week')
            }
            style={[
              styles.tab,
              activeTab === 'week' &&
                styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'week' &&
                  styles.activeTabText,
              ]}
            >
              THIS WEEK
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setActiveTab('all')
            }
            style={[
              styles.tab,
              activeTab === 'all' &&
                styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' &&
                  styles.activeTabText,
              ]}
            >
              ALL TIME
            </Text>
          </Pressable>
        </View>

        <View
          style={
            styles.yourPositionCard
          }
        >
          <View>
            <Text
              style={
                styles.smallLabel
              }
            >
              YOUR POSITION
            </Text>

            <Text
              style={
                styles.positionText
              }
            >
              {myPosition
                ? `#${myPosition}`
                : '—'}
            </Text>
          </View>

          <View
            style={styles.yourStats}
          >
            <Text
              style={
                styles.yourRuns
              }
            >
              {myRunner
                ? myRunner.runs
                : activeTab === 'week'
                ? 0
                : totalRuns}
            </Text>

            <Text
              style={
                styles.yourRunsLabel
              }
            >
              RUNS
            </Text>
          </View>

          <View
            style={styles.yourStats}
          >
            <Text
              style={
                styles.yourRuns
              }
            >
              {myRunner
                ? myRunner.km.toFixed(
                    2
                  )
                : activeTab === 'week'
                ? '0.00'
                : totalKm.toFixed(
                    2
                  )}
            </Text>

            <Text
              style={
                styles.yourRunsLabel
              }
            >
              KM
            </Text>
          </View>
        </View>

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {activeTab === 'week'
              ? 'THIS WEEK'
              : 'ALL TIME'}
          </Text>

          <Text
            style={
              styles.sectionAccent
            }
          >
            TOP 10
          </Text>
        </View>

        <View
          style={
            styles.leaderboardCard
          }
        >
          {loading ? (
            <View
              style={styles.loadingBox}
            >
              <ActivityIndicator
                size="large"
                color="#FF8C00"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                LOADING LEADERBOARD...
              </Text>
            </View>
          ) : topTen.length ===
            0 ? (
            <View
              style={styles.emptyBox}
            >
              <Text
                style={
                  styles.emptyTrophy
                }
              >
                🏃
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                NO RUNS YET
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Complete a Zero to
                Thirty run or record a
                Free Run and your
                kilometres will appear
                here.
              </Text>
            </View>
          ) : (
            topTen.map(
              (
                runner,
                index
              ) => {
                const isMe =
                  runner.user_id ===
                  myUserId;

                return (
                  <View
                    key={
                      runner.user_id
                    }
                    style={[
                      styles.rankingRow,
                      isMe &&
                        styles.myRankingRow,
                      index ===
                        topTen.length -
                          1 &&
                        styles.lastRankingRow,
                    ]}
                  >
                    <View
                      style={
                        styles.rankCircle
                      }
                    >
                      <Text
                        style={
                          styles.rankText
                        }
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.runnerInfo
                      }
                    >
                      <Text
                        style={[
                          styles.runnerName,
                          isMe &&
                            styles.myRunnerName,
                        ]}
                        numberOfLines={
                          1
                        }
                      >
                        {isMe
                          ? myName ||
                            'YOU'
                          : runner.runner_name}
                      </Text>

                      <Text
                        style={
                          styles.runnerMeta
                        }
                      >
                        {runner.runs}{' '}
                        {runner.runs ===
                        1
                          ? 'RUN'
                          : 'RUNS'}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.runnerKmBox
                      }
                    >
                      <Text
                        style={
                          styles.runnerKm
                        }
                      >
                        {runner.km.toFixed(
                          2
                        )}
                      </Text>

                      <Text
                        style={
                          styles.runnerKmLabel
                        }
                      >
                        KM
                      </Text>
                    </View>
                  </View>
                );
              }
            )
          )}
        </View>

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            RUN HISTORY
          </Text>

          <Text
            style={
              styles.sectionAccent
            }
          >
            EVERY RUN COUNTS
          </Text>
        </View>

        <View
          style={
            styles.historyCard
          }
        >
          {loading ? (
            <View
              style={
                styles.historyLoading
              }
            >
              <ActivityIndicator
                size="small"
                color="#FF8C00"
              />
            </View>
          ) : displayedRuns.length ===
            0 ? (
            <Text
              style={
                styles.noHistoryText
              }
            >
              No runs recorded yet.
            </Text>
          ) : (
            displayedRuns.map(
              (
                run,
                index
              ) => (
                <View
                  key={`${run.id}-${index}`}
                  style={[
                    styles.historyRow,
                    index ===
                      displayedRuns.length -
                        1 &&
                      styles.lastHistoryRow,
                  ]}
                >
                  <View
                    style={
                      styles.historyDateBox
                    }
                  >
                    <Text
                      style={
                        styles.historyDate
                      }
                    >
                      {formatDate(
                        run.run_date
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.historyInfo
                    }
                  >
                    <Text
                      style={
                        styles.historyRunner
                      }
                    >
                      {run.user_id ===
                      myUserId
                        ? myName ||
                          'YOU'
                        : run.runner_name ||
                          'RUNNER'}
                    </Text>

                    <Text
                      style={
                        styles.historyType
                      }
                    >
                      {getRunLabel(
                        run
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.historyKmBox
                    }
                  >
                    <Text
                      style={
                        styles.historyKm
                      }
                    >
                      {Number(
                        run.km
                      ).toFixed(2)}
                    </Text>

                    <Text
                      style={
                        styles.historyKmLabel
                      }
                    >
                      KM
                    </Text>
                  </View>
                </View>
              )
            )
          )}
        </View>

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            YOUR STATS
          </Text>
        </View>

        <View
          style={styles.statsGrid}
        >
          <View
            style={styles.statCard}
          >
            <Text
              style={
                styles.statNumber
              }
            >
              {programmedRuns}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              PROGRAMME RUNS
            </Text>
          </View>

          <View
            style={styles.statCard}
          >
            <Text
              style={
                styles.statNumber
              }
            >
              {freeRuns}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              FREE RUNS
            </Text>
          </View>

          <View
            style={styles.statCard}
          >
            <Text
              style={
                styles.statNumber
              }
            >
              {totalRuns}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              TOTAL RUNS
            </Text>
          </View>

          <View
            style={styles.statCard}
          >
            <Text
              style={
                styles.statNumber
              }
            >
              {totalKm.toFixed(2)}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              TOTAL KM
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push(
              '/progress'
            )
          }
          style={({ pressed }) => [
            styles.progressButton,
            pressed &&
              styles.progressButtonPressed,
          ]}
        >
          <View
            style={
              styles.buttonHighlight
            }
          />

          <Text
            style={
              styles.progressButtonText
            }
          >
            ‹  BACK TO PROGRESS
          </Text>
        </Pressable>

        <View
          style={styles.bottomSpace}
        />
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
    borderColor:
      'rgba(255,140,0,0.45)',
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
    textShadowColor:
      'rgba(0,0,0,0.9)',
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
    borderColor:
      'rgba(255,140,0,0.7)',
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
    backgroundColor:
      'rgba(255,140,0,0.12)',
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
    textShadowColor:
      'rgba(0,0,0,0.9)',
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

  nameCard: {
    width: '100%',
    marginTop: 15,
    borderRadius: 15,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
  },

  nameTitle: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  nameSubtitle: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },

  nameInput: {
    width: '100%',
    height: 52,
    marginTop: 12,
    borderRadius: 11,
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#444444',
    color: '#f8f8f8',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '800',
  },

  nameError: {
    color: '#ff5555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 7,
  },

  saveNameButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },

  saveNamePressed: {
    transform: [{ scale: 0.97 }],
  },

  saveNameDisabled: {
    opacity: 0.7,
  },

  saveNameText: {
    color: '#f8f8f8',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor:
      'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
  },

  currentNameRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  currentNameInfo: {
    flex: 1,
    minWidth: 0,
  },

  currentName: {
    color: '#f8f8f8',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4,
  },

  changeNameButton: {
    minWidth: 82,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor:
      'rgba(255,140,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  changeNamePressed: {
    transform: [{ scale: 0.95 }],
  },

  changeNameText: {
    color: '#FF8C00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
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
    textShadowColor:
      'rgba(0,0,0,0.8)',
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
    textShadowColor:
      'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
  },

  sectionAccent: {
    color: '#FF8C00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  leaderboardCard: {
    width: '100%',
    borderRadius: 15,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    overflow: 'hidden',
  },

  loadingBox: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
  },

  emptyBox: {
    minHeight: 210,
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

  rankingRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },

  myRankingRow: {
    backgroundColor:
      'rgba(255,140,0,0.10)',
  },

  lastRankingRow: {
    borderBottomWidth: 0,
  },

  rankCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rankText: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: '900',
  },

  runnerInfo: {
    flex: 1,
    minWidth: 0,
  },

  runnerName: {
    color: '#f8f8f8',
    fontSize: 15,
    fontWeight: '900',
  },

  myRunnerName: {
    color: '#FF8C00',
  },

  runnerMeta: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.5,
  },

  runnerKmBox: {
    alignItems: 'flex-end',
    minWidth: 70,
  },

  runnerKm: {
    color: '#FF8C00',
    fontSize: 21,
    fontWeight: '900',
  },

  runnerKmLabel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 1,
  },

  historyCard: {
    width: '100%',
    borderRadius: 15,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    overflow: 'hidden',
  },

  historyLoading: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noHistoryText: {
    color: '#888888',
    textAlign: 'center',
    paddingVertical: 30,
    fontSize: 13,
    fontWeight: '700',
  },

  historyRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },

  lastHistoryRow: {
    borderBottomWidth: 0,
  },

  historyDateBox: {
    width: 76,
  },

  historyDate: {
    color: '#FF8C00',
    fontSize: 11,
    fontWeight: '900',
  },

  historyInfo: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
  },

  historyRunner: {
    color: '#f8f8f8',
    fontSize: 13,
    fontWeight: '900',
  },

  historyType: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
  },

  historyKmBox: {
    alignItems: 'flex-end',
    minWidth: 55,
  },

  historyKm: {
    color: '#f8f8f8',
    fontSize: 16,
    fontWeight: '900',
  },

  historyKmLabel: {
    color: '#777777',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 1,
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
    textShadowColor:
      'rgba(0,0,0,0.8)',
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
    borderColor:
      'rgba(255,140,0,0.75)',
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
    backgroundColor:
      'rgba(255,255,255,0.35)',
  },

  progressButtonText: {
    color: '#f8f8f8',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor:
      'rgba(0,0,0,0.8)',
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