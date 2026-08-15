import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function CommunityScreen() {
  const router = useRouter();

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('Could not open link', error);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.heading}>
            FITNESS COMMUNITY
          </Text>

          <Text style={styles.headerSubtitle}>
            CONNECT WITH RUNNERS YOUNG AND OLD
          </Text>
        </View>

        {/* INTRO CARD */}

        <View style={styles.introCard}>
          <Text style={styles.peopleIcon}>
            🏃‍♂️ 🏃‍♀️
          </Text>

          <Text style={styles.introTitle}>
            FITTER AFTER 50
          </Text>

          <Text style={styles.introText}>
            YOUNG OR OLD, IT IS NEVER TOO LATE TO START RUNNING.
            {'\n'}
            JOIN THE FITTER AFTER 50 COMMUNITY AND START YOUR JOURNEY TODAY.
          </Text>
        </View>

        {/* YOUTUBE */}

        <Pressable
          style={({ pressed }) => [
            styles.linkCard,
            pressed && styles.linkCardPressed,
          ]}
          onPress={() =>
            openLink('https://www.youtube.com/@FitterAfter50UK')
          }
        >
          <View style={styles.youtubeIconBox}>
            <Text style={styles.youtubeIcon}>▶</Text>
          </View>

          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle}>
              YouTube Channel
            </Text>

            <Text style={styles.youtubeText}>
              @FitterAfter50UK
            </Text>

            <Text style={styles.linkDescription}>
              Run tutorials, tips and weekly videos
            </Text>
          </View>

          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* FACEBOOK */}

        <Pressable
          style={({ pressed }) => [
            styles.linkCard,
            pressed && styles.linkCardPressed,
          ]}
          onPress={() =>
            openLink('https://www.facebook.com/craig.murray.7583')
          }
        >
          <View style={styles.facebookIconBox}>
            <Text style={styles.facebookIcon}>f</Text>
          </View>

          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle}>
              Facebook Community
            </Text>

            <Text style={styles.facebookText}>
              Craig Murray
            </Text>

            <Text style={styles.linkDescription}>
              Join our community group for support and motivation
            </Text>
          </View>

          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* WEBSITE */}

        <Pressable
          style={({ pressed }) => [
            styles.linkCard,
            pressed && styles.linkCardPressed,
          ]}
          onPress={() =>
            openLink('https://second-peak-fit.base44.app/')
          }
        >
          <View style={styles.websiteIconBox}>
            <Text style={styles.websiteIcon}>🌐</Text>
          </View>

          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle}>
              Fitter After 50 Website
            </Text>

            <Text style={styles.websiteText}>
              second-peak-fit.base44.app
            </Text>

            <Text style={styles.linkDescription}>
              Programmes, resources and more
            </Text>
          </View>

          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* ABOUT ZERO TO THIRTY */}

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>
            💬 ABOUT ZERO TO THIRTY
          </Text>

          <Text style={styles.aboutText}>
            ZERO TO THIRTY IS A 9-WEEK PROGRAMME DESIGNED TO GET YOU
            RUNNING CONTINUOUSLY FOR 30 MINUTES. UNLIKE OTHER PROGRAMMES,
            WE DON'T FOCUS ON DISTANCE — JUST TIME ON YOUR FEET.
            COMPLETE THREE RUNS EACH WEEK TO UNLOCK THE NEXT WEEK,
            BUILDING YOUR FITNESS GRADUALLY AND SAFELY.
          </Text>
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
    paddingTop: 0,
    paddingBottom: 100,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },

  /* HEADER */

  header: {
    width: '100%',
    backgroundColor: '#FF8C00',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 6,
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 30,
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

  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,

    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
  },

  /* INTRO */

  introCard: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,

    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },

  peopleIcon: {
    fontSize: 44,
    marginBottom: 10,
  },

  introTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',

    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
  },

  introText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 7,
  },

  /* LINK CARDS */

  linkCard: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,

    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },

  linkCardPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  youtubeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,0,0,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  youtubeIcon: {
    color: '#FF0000',
    fontSize: 30,
    fontWeight: '900',
  },

  facebookIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(24,119,242,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  facebookIcon: {
    color: '#1877F2',
    fontSize: 34,
    fontWeight: '900',
  },

  websiteIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,140,0,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  websiteIcon: {
    fontSize: 29,
  },

  linkInfo: {
    flex: 1,
  },

  linkTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',

    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
  },

  youtubeText: {
    color: '#FF0000',
    fontSize: 13,
    marginTop: 2,
  },

  facebookText: {
    color: '#1877F2',
    fontSize: 13,
    marginTop: 2,
  },

  websiteText: {
    color: '#FF8C00',
    fontSize: 13,
    marginTop: 2,
  },

  linkDescription: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  chevron: {
    color: '#AAAAAA',
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 8,
  },

  /* ABOUT */

  aboutCard: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 18,
    padding: 18,
    marginTop: 8,

    borderWidth: 2,
    borderColor: 'rgba(255,140,0,0.75)',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },

  aboutTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,

    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
  },

  aboutText: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 4,
  },

  footer: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 20,
  },

  /* BOTTOM NAVIGATION */

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