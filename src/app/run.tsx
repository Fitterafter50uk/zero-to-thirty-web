import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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

  /*
   * TEMPORARY TEST MODE
   * These buttons do NOT save progress.
   */
  const [testAchievement, setTestAchievement] = useState(false);

  /*
   * Week 9 / Run 3 is the actual final programme run.
   *
   * testAchievement is only used by the temporary
   * TEST PROGRAMME COMPLETE button.
   */
  const isFinalRun =
    (weekNumber === 9 && runNumber === 3) ||
    testAchievement;

  const current = workout[intervalIndex];

  useEffect(() => {
    Speech.stop();

    if (current.name === 'Warm-up') {
      Speech.speak('Warm up walk');
    } else if (current.name === 'Cool-down') {
      Speech.speak('Cool down walk');
    } else if (current.type === 'RUN') {
      Speech.speak('Run');
    } else {
      Speech.speak('Walk');
    }
  }, [intervalIndex]);

  useEffect(() => {
    if (secondsLeft === 10 && current.duration > 10) {
      Speech.speak('10 seconds');
    }
  }, [secondsLeft, intervalIndex]);

  useEffect(() => {
    if (completed || !started || paused) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);

          if (intervalIndex < workout.length - 1) {
            const nextIndex = intervalIndex + 1;

            setIntervalIndex(nextIndex);

            return workout[nextIndex].duration;
          }

          saveCompletedRun();

          setCompleted(true);

          Speech.stop();

          if (isFinalRun) {
            Speech.speak(
              'Programme complete. Congratulations!'
            );
          } else {
            Speech.speak(
              `Run ${runNumber} complete. Well done.`
            );
          }

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    intervalIndex,
    completed,
    started,
    paused,
  ]);

  async function saveCompletedRun() {
    try {
      const saved =
        await AsyncStorage.getItem(PROGRESS_KEY);

      const progress = saved
        ? JSON.parse(saved)
        : {};

      const weekProgress =
        Array.isArray(progress[weekNumber])
          ? progress[weekNumber]
          : [];

      if (!weekProgress.includes(runNumber)) {
        weekProgress.push(runNumber);
      }

      weekProgress.sort(
        (a: number, b: number) => a - b
      );

      progress[weekNumber] = weekProgress;

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
    router.back();
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const timerText =
    `${minutes.toString().padStart(2, '0')}:` +
    `${seconds.toString().padStart(2, '0')}`;

  /*
   * ==========================================
   * COMPLETION SCREENS
   * ==========================================
   */

  if (completed) {

    /*
     * FINAL CONGRATULATIONS SCREEN
     */
    if (achievementStage === 1) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.achievementContainer}>

            <Text style={styles.congratulationsTitle}>
              CONGRATULATIONS!
            </Text>

            <Text style={styles.congratulationsSubtitle}>
              YOU DID IT!
            </Text>

            <Image
  source={{ uri: FINAL_GIF }}
  style={styles.finalGif}
  resizeMode="contain"
/>

<Text style={styles.finalSmallMessage}>
  27 RUNS COMPLETE
</Text>

<Text style={styles.starMessage}>
  YOU ARE A STAR!
</Text>

<Text style={styles.trophy}>
  🏆
</Text>

<Text style={styles.finalProgramme}>
  ZERO TO THIRTY
</Text>
            <Pressable
              style={styles.backButton}
              onPress={backToJourney}
            >
              <Text style={styles.backButtonText}>
                BACK TO JOURNEY
              </Text>
            </Pressable>

          </View>
        </SafeAreaView>
      );
    }

    /*
     * PROGRAMME COMPLETE
     */
    if (isFinalRun) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.achievementContainer}>

            <Text style={styles.programmeCompleteTitle}>
              PROGRAMME
            </Text>

            <Text style={styles.programmeCompleteTitle}>
              COMPLETE!
            </Text>

            <Image
              source={{ uri: SUCCESS_GIF }}
              style={styles.achievementGif}
              resizeMode="contain"
            />

            <Text style={styles.achievementMessage}>
              YOU'VE COMPLETED
            </Text>

            <Text style={styles.achievementSubMessage}>
              RUN 27 OF 27
            </Text>

            <Pressable
              style={styles.claimButton}
              onPress={() => {
                setAchievementStage(1);
              }}
            >
              <Text style={styles.claimButtonText}>
                CLAIM YOUR ACHIEVEMENT
              </Text>
            </Pressable>

          </View>
        </SafeAreaView>
      );
    }

    /*
     * NORMAL RUN COMPLETE
     */
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.achievementContainer}>

          <Text style={styles.runCompleteTitle}>
            RUN COMPLETE!
          </Text>

          <Image
            source={{ uri: SUCCESS_GIF }}
            style={styles.achievementGif}
            resizeMode="contain"
          />

          <Text style={styles.achievementMessage}>
            WELL DONE!
          </Text>

          <Text style={styles.achievementSubMessage}>
            WEEK {weekNumber} • RUN {runNumber}
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={backToJourney}
          >
            <Text style={styles.backButtonText}>
              BACK TO JOURNEY
            </Text>
          </Pressable>

        </View>
      </SafeAreaView>
    );
  }

  /*
   * ==========================================
   * NORMAL RUN SCREEN
   * ==========================================
   */

  return (
    <SafeAreaView style={styles.safeArea}>
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

        <Text style={styles.instruction}>
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
              setPaused((previous) => !previous);
            }
          }}
        >
          <Text style={styles.startButtonText}>
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
            router.back();
          }}
        >
          <Text style={styles.quitButtonText}>
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

  /*
   * ACHIEVEMENT SCREENS
   */

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

  finalMessage: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
    letterSpacing: 1,
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

  /*
   * RUN CONTROLS
   */

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

  /*
   * TEMPORARY TEST CONTROLS
   */

  
});