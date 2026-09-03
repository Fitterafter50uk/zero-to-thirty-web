import {
  Animated,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';

const backgroundImage = require('../../assets/images/HD-Running-Background.jpg');
const headerVideo = require('../../assets/images/rclelogo.mp4');

export default function HomeScreen() {
  const router = useRouter();

  const pulse = React.useRef(new Animated.Value(1)).current;

  const headerPlayer = useVideoPlayer(headerVideo, (player) => {
    player.loop = true;
    player.muted = true;
  });

  React.useEffect(() => {
    headerPlayer.play();
  }, [headerPlayer]);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  function openLink(url: string) {
    Linking.openURL(url).catch((error) => {
      console.log('Could not open link', error);
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* BACKGROUND + SCROLLING CONTENT */}
      <View style={styles.background}>

        <Image
          source={backgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        <View style={styles.darkOverlay} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.headerFrame}>
            <VideoView
              player={headerPlayer}
              style={styles.headerImage}
              contentFit="contain"
              nativeControls={false}
              playsInline
            />
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroLine}>
              AGE IS FUEL.
            </Text>

            <Text style={styles.heroBig}>
              30 MINUTES
            </Text>

            <Text style={styles.heroLine}>
              IS THE WIN.
            </Text>
          </View>

          <View style={styles.introBox}>
            <Text style={styles.intro}>
              NO PACE,NO PRESSURE, NO EXPERIENCE,NO PROBLEM
              {'\n'}
              ANY AGE, JUST YOU, YOUR TIME AND THE WANT TO TRY.
            </Text>
          </View>

          <Animated.View
            style={[
              styles.startButtonWrapper,
              {
                transform: [{ scale: pulse }],
              },
            ]}
          >
            <Pressable
              onPress={() => router.push('/weeks')}
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
              ]}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 25,
                  right: 25,
                  height: 12,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.35)',
                }}
              />

              <Image
                source={require('../../assets/images/test.png.png')}
                style={styles.startLogo}
                resizeMode="contain"
              />

              <Text style={styles.startText}>
                START YOUR PROGRAM
              </Text>
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={() => router.push('/leaderboard')}
            style={({ pressed }) => [
              styles.leaderboardButton,
              pressed && styles.leaderboardButtonPressed,
            ]}
          >
            <Ionicons
              name="trophy"
              size={25}
              color="#FF8C00"
            />

            <Text style={styles.leaderboardButtonText}>
              VIEW LEADERBOARD
            </Text>

            <Ionicons
              name="chevron-forward"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          <View style={styles.infoRow}>

            <View style={styles.infoBox}>
              <Text style={styles.infoNumber}>
                9
              </Text>

              <Text style={styles.infoLabel}>
                WEEKS
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoNumber}>
                27
              </Text>

              <Text style={styles.infoLabel}>
                RUNS
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoNumber}>
                0
              </Text>

              <Text style={styles.infoLabel}>
                EXCUSES
              </Text>
            </View>

          </View>

          <Text style={styles.footer}>
            START WHERE YOU ARE. BUILD FROM THERE.
          </Text>

          <View style={styles.communitySection}>

            <Text style={styles.communityTitle}>
              JOIN OUR COMMUNITY
            </Text>

            <View style={styles.communityRow}>

              <Pressable
                style={styles.communityBox}
                onPress={() =>
                  openLink(
                    'https://www.youtube.com/@FitterAfter50UK'
                  )
                }
              >
                <Ionicons
                  name="logo-youtube"
                  size={30}
                  color="#FF0000"
                />

                <Text style={styles.communityLabel}>
                  YOUTUBE
                </Text>
              </Pressable>

              <Pressable
                style={styles.communityBox}
                onPress={() =>
                  openLink(
                    'https://www.facebook.com/craig.murray.7583'
                  )
                }
              >
                <Ionicons
                  name="logo-facebook"
                  size={30}
                  color="#1877F2"
                />

                <Text style={styles.communityLabel}>
                  FACEBOOK
                </Text>
              </Pressable>

              <Pressable
                style={styles.communityBox}
                onPress={() =>
                  openLink(
                    'https://second-peak-fit.base44.app/'
                  )
                }
              >
                <Ionicons
                  name="globe-outline"
                  size={30}
                  color="#FF8C00"
                />

                <Text style={styles.communityLabel}>
                  WEBSITE
                </Text>
              </Pressable>

            </View>
          </View>

        </ScrollView>

      </View>

      {/* BOTTOM NAV — OUTSIDE THE SCROLLVIEW, SAME AS COMMUNITY */}
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
          onPress={() => router.push('/leaderboard')}
        >
          <Text style={styles.navIcon}>
            🏆
          </Text>

          <Text style={styles.navText}>
            LEADERBOARD
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

  background: {
    flex: 1,
    position: 'relative',
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },

  scrollView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 35,
    width: '100%',
    maxWidth: 850,
    alignSelf: 'center',
  },

  headerFrame: {
    width: '100%',
    maxWidth: 650,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  headerImage: {
    width: 650,
    height: 180,
    transform: [{ scale: 1.0 }],
  },

  hero: {
    width: '100%',
    maxWidth: 650,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.48)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 5,
  },

  heroLine: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
  },

  heroBig: {
    color: '#FF8C00',
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    marginVertical: 3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
  },

  introBox: {
    width: '100%',
    maxWidth: 650,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 22,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },

  intro: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
  },

  startButtonWrapper: {
    width: '100%',
    maxWidth: 650,
    marginBottom: 15,
  },

  startButton: {
    width: '100%',
    minHeight: 90,
    borderRadius: 14,
    backgroundColor: '#FF8C00',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.6,
    shadowRadius: 9,
    elevation: 12,
  },

  startButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  startLogo: {
    width: 62,
    height: 62,
    marginRight: 12,
  },

  startText: {
    color: '#f8f8f8',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
  },

  leaderboardButton: {
    width: '100%',
    maxWidth: 650,
    minHeight: 62,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginBottom: 25,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 5,
  },

  leaderboardButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  leaderboardButtonText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginHorizontal: 10,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 3,
  },

  infoRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 650,
    gap: 10,
  },

  infoBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },

  infoNumber: {
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

  infoLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 3,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  footer: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 28,
    opacity: 0.8,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
  },

  communitySection: {
    width: '100%',
    maxWidth: 650,
    marginTop: 28,
    marginBottom: 25,
  },

  communityTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 3,
  },

  communityRow: {
    flexDirection: 'row',
    gap: 10,
  },

  communityBox: {
    flex: 1,
    minHeight: 75,
    backgroundColor: 'rgba(0,0,0,0.72)',
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

  communityLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textShadowColor: '#000000',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 1,
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
    fontSize: 20,
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
    fontSize: 7,
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