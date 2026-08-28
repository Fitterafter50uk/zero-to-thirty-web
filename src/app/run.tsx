import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const PROGRESS_KEY = 'zero_to_thirty_progress';

const SUCCESS_GIF =
  'https://i.ibb.co/jvCcgCQF/SUCCESS2.gif';

const FINAL_GIF =
  'https://i.postimg.cc/cCJtCsfH/ezgif-com-speed.gif';

const WORKOUTS = {
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

export default function RunScreen() {
  const router = useRouter();
  const { week, run } = useLocalSearchParams();

  const weekNumber = Math.min(
    9,
    Math.max(1, Number(week) || 1)
  ) as keyof typeof WORKOUTS;

  const runNumber = Math.min(
    3,
    Math.max(1, Number(run) || 1)
  );

  const workout = WORKOUTS[weekNumber];

  const [intervalIndex, setIntervalIndex] = useState(0);

  const [secondsLeft, setSecondsLeft] = useState(
    workout[0].duration
  );

  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [achievementStage, setAchievementStage] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);

  const current = workout[intervalIndex];

  const isFinalRun =
    weekNumber === 9 && runNumber === 3;

  async function stopCurrentAudio() {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.log('Could not stop audio', error);
      soundRef.current = null;
    }
  }

  async function playAudio(file: number) {
    await stopCurrentAudio();

    try {
      const { sound } = await Audio.Sound.createAsync(file);

      soundRef.current = sound;

      await sound.playAsync();
    } catch (error) {
      console.log('Could not play audio', error);
    }
  }

  async function playRunVoice() {
    await playAudio(
      require('../../public/audio/run.mp3')
    );
  }

  async function playWarmupVoice() {
    await playAudio(
      require('../../public/audio/warmup.mp3')
    );
  }

  async function playWalkVoice() {
    await playAudio(
      require('../../public/audio/walk.mp3')
    );
  }

  async function playCooldownVoice() {
    await playAudio(
      require('../../public/audio/cooldown.mp3')
    );
  }

  async function playTenSecondsVoice() {
    await playAudio(
      require('../../public/audio/ten_seconds.mp3')
    );
  }

  async function playEncourage1() {
    await playAudio(
      require('../../public/audio/encourage_1.mp3')
    );
  }

  async function playEncourage2() {
    await playAudio(
      require('../../public/audio/encourage_2.mp3')
    );
  }

  async function playEncourage3() {
    await playAudio(
      require('../../public/audio/encourage_3.mp3')
    );
  }

  async function playEncourage4() {
    await playAudio(
      require('../../public/audio/encourage_4.mp3')
    );
  }

  async function playEncourage5() {
    await playAudio(
      require('../../public/audio/encourage_5.mp3')
    );
  }

  async function playEncourage6() {
    await playAudio(
      require('../../public/audio/encourage_6.mp3')
    );
  }

  async function playEncourage7() {
    await playAudio(
      require('../../public/audio/encourage_7.mp3')
    );
  }

  async function playEncourage8() {
    await playAudio(
      require('../../public/audio/encourage_8.mp3')
    );
  }

  async function playEncourage9() {
    await playAudio(
      require('../../public/audio/encourage_9.mp3')
    );
  }

  async function playEncourage10() {
    await playAudio(
      require('../../public/audio/encourage_10.mp3')
    );
  }

  async function playRecovery1() {
    await playAudio(
      require('../../public/audio/recovery_1.mp3')
    );
  }

  async function playRecovery2() {
    await playAudio(
      require('../../public/audio/recovery_2.mp3')
    );
  }

  async function playRecovery3() {
    await playAudio(
      require('../../public/audio/recovery_3.mp3')
    );
  }

  async function playRecovery4() {
    await playAudio(
      require('../../public/audio/recovery_4.mp3')
    );
  }

  async function playRecovery5() {
    await playAudio(
      require('../../public/audio/recovery_5.mp3')
    );
  }

  async function playRecovery6() {
    await playAudio(
      require('../../public/audio/recovery_6.mp3')
    );
  }

  async function playRecovery7() {
    await playAudio(
      require('../../public/audio/recovery_7.mp3')
    );
  }

  async function playRecovery8() {
    await playAudio(
      require('../../public/audio/recovery_8.mp3')
    );
  }

  async function playRecovery9() {
    await playAudio(
      require('../../public/audio/recovery_9.mp3')
    );
  }

  async function playRecovery10() {
    await playAudio(
      require('../../public/audio/recovery_10.mp3')
    );
  }

  /*
   * INTERVAL START VOICES
   */

  useEffect(() => {
    if (!started || paused || completed) {
      return;
    }

    Speech.stop();

    if (current.name === 'Warm-up') {
      playWarmupVoice();
    } else if (current.name === 'Cool-down') {
      playCooldownVoice();
    } else if (current.type === 'RUN') {
      playRunVoice();
    } else {
      playWalkVoice();
    }
  }, [intervalIndex, started]);

  /*
   * 10 SECOND COUNTDOWN
   */

  useEffect(() => {
    if (
      !started ||
      paused ||
      completed ||
      current.type !== 'RUN' ||
      current.duration <= 10
    ) {
      return;
    }

    if (secondsLeft === 10) {
      playTenSecondsVoice();
    }
  }, [secondsLeft]);

  /*
   * MOTIVATIONAL VOICES
   *
   * IMPORTANT:
   * No encouragement is allowed during
   * the final 10 seconds of a run.
   */

  useEffect(() => {
    if (
      !started ||
      paused ||
      completed ||
      current.type !== 'RUN' ||
      current.duration < 60
    ) {
      return;
    }

    /*
     * The 10-second countdown always has priority.
     */
    if (secondsLeft <= 10) {
      return;
    }

    const elapsed =
      current.duration - secondsLeft;

    if (elapsed === 60) {
      playEncourage1();
    } else if (elapsed === 120) {
      playEncourage2();
    } else if (elapsed === 180) {
      playEncourage3();
    } else if (elapsed === 240) {
      playEncourage4();
    } else if (elapsed === 300) {
      playEncourage5();
    } else if (elapsed === 360) {
      playEncourage6();
    } else if (elapsed === 420) {
      playEncourage7();
    } else if (elapsed === 480) {
      playEncourage8();
    } else if (elapsed === 540) {
      playEncourage9();
    } else if (elapsed === 600) {
      playEncourage10();
    }
  }, [secondsLeft]);

  /*
   * RECOVERY VOICES
   */

  useEffect(() => {
    if (
      !started ||
      paused ||
      completed ||
      current.type !== 'WALK' ||
      current.name === 'Warm-up' ||
      current.name === 'Cool-down' ||
      current.duration < 60
    ) {
      return;
    }

    const elapsed =
      current.duration - secondsLeft;

    if (elapsed === 30) {
      if (intervalIndex === 2) {
        playRecovery1();
      } else if (intervalIndex === 4) {
        playRecovery2();
      } else if (intervalIndex === 6) {
        playRecovery3();
      } else if (intervalIndex === 8) {
        playRecovery4();
      } else if (intervalIndex === 10) {
        playRecovery5();
      } else if (intervalIndex === 12) {
        playRecovery6();
      } else if (intervalIndex === 14) {
        playRecovery7();
      } else if (intervalIndex === 16) {
        playRecovery8();
      } else if (intervalIndex === 18) {
        playRecovery9();
      } else {
        playRecovery10();
      }
    }
  }, [secondsLeft]);

  /*
   * MAIN TIMER
   */

  useEffect(() => {
    if (completed || !started || paused) {
      return;
    }

    const startTimeRef = {
      current: Date.now(),
    };

    const intervalStartSeconds =
      secondsLeft;

    const timer = setInterval(() => {
      const elapsedSeconds =
        Math.floor(
          (Date.now() -
            startTimeRef.current) /
            1000
        );

      const newSecondsLeft =
        intervalStartSeconds -
        elapsedSeconds;

      if (newSecondsLeft > 0) {
        setSecondsLeft(newSecondsLeft);
        return;
      }

      clearInterval(timer);

      if (
        intervalIndex <
        workout.length - 1
      ) {
        const nextIndex =
          intervalIndex + 1;

        setIntervalIndex(nextIndex);

        setSecondsLeft(
          workout[nextIndex].duration
        );
      } else {
        setSecondsLeft(0);

        saveCompletedRun();

        setCompleted(true);

        Speech.stop();

        stopCurrentAudio();

        if (isFinalRun) {
          Speech.speak(
            'Programme complete. Congratulations!'
          );
        } else {
          Speech.speak(
            `Run ${runNumber} complete. Well done.`
          );
        }
      }
    }, 250);

    return () =>
      clearInterval(timer);
  }, [
    intervalIndex,
    completed,
    started,
    paused,
  ]);

  async function saveCompletedRun() {
    try {
      const saved =
        await AsyncStorage.getItem(
          PROGRESS_KEY
        );

      const progress = saved
        ? JSON.parse(saved)
        : {};

      const weekProgress =
        Array.isArray(
          progress[weekNumber]
        )
          ? progress[weekNumber]
          : [];

      if (
        !weekProgress.includes(
          runNumber
        )
      ) {
        weekProgress.push(
          runNumber
        );
      }

      weekProgress.sort(
        (a: number, b: number) =>
          a - b
      );

      progress[weekNumber] =
        weekProgress;

      await AsyncStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.log(
        'Could not save completed run',
        error
      );
    }
  }

  function backToJourney() {
    Speech.stop();
    stopCurrentAudio();
    router.back();
  }

  const minutes =
    Math.floor(secondsLeft / 60);

  const seconds =
    secondsLeft % 60;

  const timerText =
    `${minutes
      .toString()
      .padStart(2, '0')}:` +
    `${seconds
      .toString()
      .padStart(2, '0')}`;

  /*
   * COMPLETION SCREENS
   */

  if (completed) {

    if (achievementStage === 1) {
      return (
        <SafeAreaView
          style={styles.safeArea}
        >
          <View
            style={
              styles.achievementContainer
            }
          >

            <Text
              style={
                styles.congratulationsTitle
              }
            >
              CONGRATULATIONS!
            </Text>

            <Text
              style={
                styles.congratulationsSubtitle
              }
            >
              YOU DID IT!
            </Text>

            <Image
              source={{
                uri: FINAL_GIF,
              }}
              style={styles.finalGif}
              resizeMode="contain"
            />

            <Text
              style={
                styles.finalSmallMessage
              }
            >
              27 RUNS COMPLETE
            </Text>

            <Text
              style={styles.starMessage}
            >
              YOU ARE A STAR!
            </Text>

            <Text
              style={styles.trophy}
            >
              🏆
            </Text>

            <Text
              style={
                styles.finalProgramme
              }
            >
              ZERO TO THIRTY
            </Text>

            <Pressable
              style={styles.backButton}
              onPress={
                backToJourney
              }
            >
              <Text
                style={
                  styles.backButtonText
                }
              >
                BACK TO JOURNEY
              </Text>
            </Pressable>

          </View>
        </SafeAreaView>
      );
    }

    if (isFinalRun) {
      return (
        <SafeAreaView
          style={styles.safeArea}
        >
          <View
            style={
              styles.achievementContainer
            }
          >

            <Text
              style={
                styles.programmeCompleteTitle
              }
            >
              PROGRAMME
            </Text>

            <Text
              style={
                styles.programmeCompleteTitle
              }
            >
              COMPLETE!
            </Text>

            <Image
              source={{
                uri: SUCCESS_GIF,
              }}
              style={styles.achievementGif}
              resizeMode="contain"
            />

            <Text
              style={
                styles.achievementMessage
              }
            >
              YOU'VE COMPLETED
            </Text>

            <Text
              style={
                styles.achievementSubMessage
              }
            >
              RUN 27 OF 27
            </Text>

            <Pressable
              style={styles.claimButton}
              onPress={() => {
                setAchievementStage(1);
              }}
            >
              <Text
                style={
                  styles.claimButtonText
                }
              >
                CLAIM YOUR ACHIEVEMENT
              </Text>
            </Pressable>

          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.achievementContainer
          }
        >

          <Text
            style={
              styles.runCompleteTitle
            }
          >
            RUN COMPLETE!
          </Text>

          <Image
            source={{
              uri: SUCCESS_GIF,
            }}
            style={styles.achievementGif}
            resizeMode="contain"
          />

          <Text
            style={
              styles.achievementMessage
            }
          >
            WELL DONE!
          </Text>

          <Text
            style={
              styles.achievementSubMessage
            }
          >
            WEEK {weekNumber} • RUN {runNumber}
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={
              backToJourney
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              BACK TO JOURNEY
            </Text>
          </Pressable>

        </View>
      </SafeAreaView>
    );
  }

  /*
   * NORMAL RUN SCREEN
   */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.container}>

        <Text style={styles.week}>
          WEEK {weekNumber} • RUN {runNumber}
        </Text>

        <Text style={styles.phase}>
          {current.name === 'Warm-up'
            ? 'GET READY'
            : current.name === 'Cool-down'
            ? 'COOL DOWN'
            : current.type === 'RUN'
            ? 'RUN'
            : 'WALK'}
        </Text>

        <Text style={styles.timer}>
          {timerText}
        </Text>

        <Text
          style={styles.instruction}
        >
          {current.name === 'Warm-up'
            ? 'WALK'
            : current.name === 'Cool-down'
            ? 'WALK'
            : current.type}
        </Text>

        <Pressable
          style={styles.startButton}
          onPress={() => {
            if (!started) {
              setStarted(true);
              setPaused(false);
            } else {
              setPaused(
                (previous) =>
                  !previous
              );
            }
          }}
        >
          <Text
            style={
              styles.startButtonText
            }
          >
            {!started
              ? 'START RUN'
              : paused
              ? 'RESUME RUN'
              : 'PAUSE RUN'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.quitButton}
          onPress={() => {
            Speech.stop();
            stopCurrentAudio();
            router.back();
          }}
        >
          <Text
            style={
              styles.quitButtonText
            }
          >
            QUIT RUN
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  week: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },

  phase: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 20,
  },

  timer: {
    color: '#FFFFFF',
    fontSize: 82,
    fontWeight: '900',
    marginTop: 25,
  },

  instruction: {
    color: '#FF8C00',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 15,
  },

  achievementContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  runCompleteTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },

  programmeCompleteTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 43,
  },

  achievementGif: {
    width: '100%',
    maxWidth: 420,
    height: 260,
    marginTop: 15,
  },

  achievementMessage: {
    color: '#FF8C00',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
    letterSpacing: 1,
  },

  achievementSubMessage: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },

  claimButton: {
    width: '100%',
    maxWidth: 500,
    minHeight: 65,
    backgroundColor: '#FF8C00',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  congratulationsTitle: {
    color: '#FF8C00',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },

  congratulationsSubtitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
  },

  finalGif: {
    width: '100%',
    maxWidth: 500,
    height: 280,
    marginTop: 10,
  },

  finalProgramme: {
    color: '#FF8C00',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
    letterSpacing: 1,
  },

  finalSmallMessage: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
    letterSpacing: 2,
  },

  starMessage: {
    color: '#FF8C00',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },

  trophy: {
    fontSize: 70,
    marginTop: 5,
  },

  backButton: {
    width: '100%',
    maxWidth: 500,
    minHeight: 60,
    backgroundColor: '#FF8C00',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1,
  },

  startButton: {
    width: '100%',
    maxWidth: 500,
    minHeight: 65,
    backgroundColor: '#FF8C00',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },

  quitButton: {
    width: '100%',
    maxWidth: 500,
    minHeight: 55,
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  quitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});