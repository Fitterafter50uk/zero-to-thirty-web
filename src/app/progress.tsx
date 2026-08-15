import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROGRESS_KEY = 'zero_to_thirty_progress';
const PB_KEY = 'zero_to_thirty_personal_bests';

export default function ProgressScreen() {
  const router = useRouter();

  const [progress, setProgress] = useState<Record<string, any>>({});

  const [personalBests, setPersonalBests] = useState({
    fastest1k: '',
    fastest5k: '',
    fastest10k: '',
    longestRun: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadProgress();
      loadPersonalBests();
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

  async function loadPersonalBests() {
    try {
      const saved = await AsyncStorage.getItem(PB_KEY);

      if (saved) {
        setPersonalBests(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Could not load personal bests', error);
    }
  }

  function formatTimeInput(value: string) {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 4) {
      return (
        numbers.slice(0, -2) +
        ':' +
        numbers.slice(-2)
      );
    }

    return (
      numbers.slice(0, -4) +
      ':' +
      numbers.slice(-4, -2) +
      ':' +
      numbers.slice(-2)
    );
  }

  async function updatePersonalBest(
    key: keyof typeof personalBests,
    value: string
  ) {
    const formatted = formatTimeInput(value);

    const updated = {
      ...personalBests,
      [key]: formatted,
    };

    setPersonalBests(updated);

    try {
      await AsyncStorage.setItem(
        PB_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.log('Could not save personal best', error);
    }
  }

  let programmeRuns = 0;

  for (let week = 1; week <= 9; week++) {
    const runs = Array.isArray(progress[week])
      ? progress[week]
      : [];

    programmeRuns += runs.length;
  }

  const completedWeeks = Object.keys(progress).filter(
    (week) =>
      Array.isArray(progress[week]) &&
      progress[week].length >= 3
  ).length;

  const programmePercentage = Math.min(
    100,
    Math.round((programmeRuns / 27) * 100)
  );

  const extraRuns = progress.extraRuns || 0;
  const extraKm = progress.extraKm || 0;

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* PAGE HEADER */}

        <Text style={styles.heading}>
          YOUR PROGRESS
        </Text>

        <Text style={styles.subheading}>
          ZERO TO THIRTY
        </Text>

        {/* PROGRAMME PROGRESS */}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>
            PROGRAMME PROGRESS
          </Text>
        </View>

        <View style={styles.mainProgress}>

          <Text style={styles.progressNumber}>
            {programmePercentage}%
          </Text>

          <Text style={styles.progressLabel}>
            PROGRAMME COMPLETE
          </Text>

        </View>

        <View style={styles.stats}>

          <View style={styles.stat}>
            <Text style={styles.number}>
              {programmeRuns}
            </Text>

            <Text style={styles.label}>
              RUNS
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.number}>
              {completedWeeks}
            </Text>

            <Text style={styles.label}>
              WEEKS
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.number}>
              {Math.max(0, 27 - programmeRuns)}
            </Text>

            <Text style={styles.label}>
              REMAINING
            </Text>
          </View>

        </View>

        {/* FREE RUNS */}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>
            FREE RUNS
          </Text>
        </View>

        <View style={styles.stats}>

          <View style={styles.stat}>

            <Text style={styles.number}>
              {extraRuns}
            </Text>

            <Text style={styles.label}>
              EXTRA RUNS
            </Text>

          </View>

          <View style={styles.stat}>

            <Text style={styles.number}>
              {extraKm}
            </Text>

            <Text style={styles.label}>
              EXTRA KM
            </Text>

          </View>

        </View>

        {/* PERSONAL BESTS */}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>
            PERSONAL BESTS
          </Text>
        </View>

        <Text style={styles.pbIntro}>
          ENTER YOUR BEST TIMES
        </Text>

        {/* FASTEST 1 KM */}

        <View style={styles.pbBox}>

          <View style={styles.pbInfo}>

            <Text style={styles.pbDistance}>
              1 KM
            </Text>

            <Text style={styles.pbTitle}>
              FASTEST 1 KM
            </Text>

          </View>

          <TextInput
            value={personalBests.fastest1k}
            onChangeText={(value) =>
              updatePersonalBest(
                'fastest1k',
                value
              )
            }
            placeholder="2:34"
            placeholderTextColor="#666666"
            style={styles.pbInput}
            keyboardType="numeric"
            maxLength={5}
          />

        </View>

        {/* FASTEST 5 KM */}

        <View style={styles.pbBox}>

          <View style={styles.pbInfo}>

            <Text style={styles.pbDistance}>
              5 KM
            </Text>

            <Text style={styles.pbTitle}>
              FASTEST 5 KM
            </Text>

          </View>

          <TextInput
            value={personalBests.fastest5k}
            onChangeText={(value) =>
              updatePersonalBest(
                'fastest5k',
                value
              )
            }
            placeholder="25:30"
            placeholderTextColor="#666666"
            style={styles.pbInput}
            keyboardType="numeric"
            maxLength={5}
          />

        </View>

        {/* FASTEST 10 KM */}

        <View style={styles.pbBox}>

          <View style={styles.pbInfo}>

            <Text style={styles.pbDistance}>
              10 KM
            </Text>

            <Text style={styles.pbTitle}>
              FASTEST 10 KM
            </Text>

          </View>

          <TextInput
            value={personalBests.fastest10k}
            onChangeText={(value) =>
              updatePersonalBest(
                'fastest10k',
                value
              )
            }
            placeholder="55:00"
            placeholderTextColor="#666666"
            style={styles.pbInput}
            keyboardType="numeric"
            maxLength={5}
          />

        </View>

        {/* LONGEST RUN */}

        <View style={styles.pbBox}>

          <View style={styles.pbInfo}>

            <Text style={styles.pbDistance}>
              DISTANCE
            </Text>

            <Text style={styles.pbTitle}>
              LONGEST RUN
            </Text>

          </View>

          <TextInput
            value={personalBests.longestRun}
            onChangeText={(value) =>
              updatePersonalBest(
                'longestRun',
                value
              )
            }
            placeholder="10.5 KM"
            placeholderTextColor="#666666"
            style={styles.pbInput}
            keyboardType="numeric"
            maxLength={8}
          />

        </View>

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

  /* ORANGE ORIGINAL-APP STYLE HEADERS */

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

  mainProgress: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.72)',
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

  progressNumber: {
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

  progressLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },

  stats: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 12,
  },

  stat: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingVertical: 14,
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
    fontSize: 29,
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
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 3,
    textAlign: 'center',
  },

  pbIntro: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: -3,
    marginBottom: 12,
  },

  pbBox: {
    width: '100%',
    minHeight: 78,
    backgroundColor: 'rgba(0,0,0,0.72)',
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

  pbInfo: {
    flex: 1,
  },

  pbDistance: {
    color: '#FF8C00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
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

  pbInput: {
    width: 115,
    height: 50,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 9,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 5,

    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
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