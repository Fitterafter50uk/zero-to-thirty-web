import React, { useEffect, useState } from 'react';
import {
Linking,
Pressable,
ScrollView,
StyleSheet,
Text,
TextInput,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const NAME_KEY = 'zero_to_thirty_community_name';

const YOUTUBE_URL = 'https://www.youtube.com/@FitterAfter50UK';
const FACEBOOK_URL = 'https://www.facebook.com/craig.murray.7583';
const WEBSITE_URL = 'https://second-peak-fit.base44.app/';

type CommunityPost = {
id: string;
display_name: string;
message: string;
created_at: string;
};

function formatDate(dateString: string) {
const date = new Date(dateString);

return date.toLocaleDateString('en-GB', {
day: 'numeric',
month: 'short',
year: 'numeric',
});
}

export default function CommunityScreen() {
const router = useRouter();

const [messageName, setMessageName] = useState('');
const [message, setMessage] = useState('');
const [posts, setPosts] = useState<CommunityPost[]>([]);
const [posting, setPosting] = useState(false);

useEffect(() => {
loadName();
loadMessages();

const interval = setInterval(() => {
  loadMessages();
}, 5000);

return () => {
  clearInterval(interval);
};

}, []);

async function loadName() {
try {
const savedName = await AsyncStorage.getItem(NAME_KEY);

  if (savedName) {
    setMessageName(savedName);
  }
} catch (error) {
  console.log('Could not load Zero to Thirty community name', error);
}

}

async function loadMessages() {
const { data, error } = await supabase
.from('zero_to_thirty_community_posts')
.select('*')
.order('created_at', { ascending: false })
.limit(30);

if (error) {
  console.log('Could not load Zero to Thirty community messages', error);
  return;
}

setPosts((data || []) as CommunityPost[]);

}

async function openLink(url: string) {
try {
await Linking.openURL(url);
} catch (error) {
console.log('Could not open link', error);
}
}

async function postMessage() {
const cleanName = messageName.trim();
const cleanMessage = message.trim();

if (cleanName.length < 2 || cleanName.length > 30) {
  return;
}

if (!cleanMessage || cleanMessage.length > 500) {
  return;
}

setPosting(true);

try {
  await AsyncStorage.setItem(NAME_KEY, cleanName);
} catch (error) {
  console.log('Could not save Zero to Thirty community name', error);
}

const { error } = await supabase
  .from('zero_to_thirty_community_posts')
  .insert({
    display_name: cleanName,
    message: cleanMessage,
  });

if (error) {
  console.log('Could not post Zero to Thirty community message', error);
  setPosting(false);
  return;
}

setMessage('');
setPosting(false);

await loadMessages();

}

return (
<SafeAreaView style={styles.safeArea}>
<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} >
<View style={styles.header}>
<Text style={styles.heading}>
FITNESS COMMUNITY
</Text>

      <Text style={styles.headerSubtitle}>
        ZERO TO THIRTY • FITTER AFTER 50
      </Text>
    </View>

    <View style={styles.introCard}>
      <Text style={styles.peopleIcon}>
        🏃‍♂️ 🏃‍♀️
      </Text>

      <Text style={styles.introTitle}>
        YOU'RE NOT ALONE
      </Text>

      <Text style={styles.introText}>
        THOUSANDS OF PEOPLE ARE GETTING FITTER, STRONGER
        {'\n'}
        AND MORE CONFIDENT — ONE RUN AT A TIME.
      </Text>
    </View>

    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        FOLLOW THE JOURNEY
      </Text>

      <Text style={styles.sectionSubtitle}>
        FIND FITTER AFTER 50 ONLINE
      </Text>

      <View style={styles.socialRow}>
        <Pressable
          style={({ pressed }) => [
            styles.socialItem,
            pressed && styles.socialPressed,
          ]}
          onPress={() => openLink(YOUTUBE_URL)}
        >
          <View style={styles.youtubeSocialIcon}>
            <Text style={styles.youtubeIcon}>
              ▶
            </Text>
          </View>

          <Text style={styles.socialLabel}>
            YOUTUBE
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.socialItem,
            pressed && styles.socialPressed,
          ]}
          onPress={() => openLink(FACEBOOK_URL)}
        >
          <View style={styles.facebookSocialIcon}>
            <Text style={styles.facebookIcon}>
              f
            </Text>
          </View>

          <Text style={styles.socialLabel}>
            FACEBOOK
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.socialItem,
            pressed && styles.socialPressed,
          ]}
          onPress={() => openLink(WEBSITE_URL)}
        >
          <View style={styles.websiteSocialIcon}>
            <Text style={styles.websiteIcon}>
              🌐
            </Text>
          </View>

          <Text style={styles.socialLabel}>
            WEBSITE
          </Text>
        </Pressable>
      </View>
    </View>

    <View style={styles.chatCard}>
      <View style={styles.liveHeading}>
        <View style={styles.liveDot} />

        <Text style={styles.chatTitle}>
          LIVE MESSAGES
        </Text>
      </View>

      <Text style={styles.chatSubtitle}>
        ZERO TO THIRTY RUNNERS • SHARE YOUR PROGRESS
      </Text>

      <View style={styles.messageForm}>
        <TextInput
          value={messageName}
          onChangeText={setMessageName}
          placeholder="YOUR NAME"
          placeholderTextColor="#777777"
          maxLength={30}
          style={styles.input}
        />

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="WRITE A MESSAGE..."
          placeholderTextColor="#777777"
          maxLength={500}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.messageInput]}
        />

        <Text style={styles.characterCount}>
          {message.length}/500
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.orangeButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={postMessage}
          disabled={posting}
        >
          <Text style={styles.orangeButtonText}>
            {posting ? 'POSTING...' : 'POST MESSAGE'}
          </Text>
        </Pressable>
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyMessages}>
          <Text style={styles.emptyMessagesText}>
            NO ZERO TO THIRTY MESSAGES YET
          </Text>

          <Text style={styles.emptyMessagesSubtext}>
            START THE CONVERSATION.
          </Text>
        </View>
      ) : (
        <View style={styles.messagesList}>
          {posts.map((post) => (
            <View
              key={post.id}
              style={styles.messageRow}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {post.display_name
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageName}>
                    {post.display_name}
                  </Text>

                  <Text style={styles.messageDate}>
                    {formatDate(post.created_at)}
                  </Text>
                </View>

                <Text style={styles.messageText}>
                  {post.message}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>

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

container: {
alignItems: 'center',
paddingHorizontal: 20,
paddingTop: 0,
paddingBottom: 100,
width: '100%',
maxWidth: 700,
alignSelf: 'center',
},

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

sectionCard: {
width: '100%',
backgroundColor: 'rgba(0,0,0,0.72)',
borderRadius: 18,
padding: 18,
marginBottom: 18,
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

sectionTitle: {
color: '#FFFFFF',
fontSize: 19,
fontWeight: '900',
textAlign: 'center',
textShadowColor: 'rgba(0,0,0,0.8)',
textShadowOffset: {
width: 1,
height: 1,
},
textShadowRadius: 3,
},

sectionSubtitle: {
color: '#AAAAAA',
fontSize: 11,
fontWeight: '700',
textAlign: 'center',
marginTop: 4,
marginBottom: 15,
letterSpacing: 0.7,
},

socialRow: {
width: '100%',
flexDirection: 'row',
alignItems: 'stretch',
justifyContent: 'space-between',
},

socialItem: {
width: '31.5%',
minHeight: 90,
backgroundColor: 'rgba(17,17,17,0.95)',
borderRadius: 14,
borderWidth: 1,
borderColor: 'rgba(255,140,0,0.35)',
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 10,
},

socialPressed: {
opacity: 0.75,
transform: [{ scale: 0.97 }],
},

youtubeSocialIcon: {
width: 46,
height: 34,
borderRadius: 9,
backgroundColor: 'rgba(255,0,0,0.14)',
alignItems: 'center',
justifyContent: 'center',
marginBottom: 7,
},

youtubeIcon: {
color: '#FF0000',
fontSize: 21,
fontWeight: '900',
},

facebookSocialIcon: {
width: 38,
height: 38,
borderRadius: 10,
backgroundColor: 'rgba(24,119,242,0.14)',
alignItems: 'center',
justifyContent: 'center',
marginBottom: 5,
},

facebookIcon: {
color: '#1877F2',
fontSize: 28,
fontWeight: '900',
},

websiteSocialIcon: {
width: 42,
height: 38,
borderRadius: 10,
backgroundColor: 'rgba(255,140,0,0.14)',
alignItems: 'center',
justifyContent: 'center',
marginBottom: 5,
},

websiteIcon: {
fontSize: 22,
},

socialLabel: {
color: '#FFFFFF',
fontSize: 10,
fontWeight: '900',
letterSpacing: 0.5,
},

chatCard: {
width: '100%',
backgroundColor: 'rgba(0,0,0,0.72)',
borderRadius: 18,
padding: 18,
marginBottom: 18,
borderWidth: 2,
borderColor: 'rgba(255,140,0,0.75)',
shadowColor: '#000000',
shadowOffset: {
width: 0,
height: 4,
},
shadowOpacity: 0.35,
shadowRadius: 6,
elevation: 6,
},

liveHeading: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
},

liveDot: {
width: 9,
height: 9,
borderRadius: 5,
backgroundColor: '#FF8C00',
marginRight: 7,
},

chatTitle: {
color: '#FFFFFF',
fontSize: 19,
fontWeight: '900',
textShadowColor: 'rgba(0,0,0,0.8)',
textShadowOffset: {
width: 1,
height: 1,
},
textShadowRadius: 3,
},

chatSubtitle: {
color: '#AAAAAA',
fontSize: 11,
fontWeight: '700',
textAlign: 'center',
marginTop: 4,
marginBottom: 14,
letterSpacing: 0.5,
},

messageForm: {
width: '100%',
backgroundColor: 'rgba(17,17,17,0.9)',
borderRadius: 14,
padding: 12,
borderWidth: 1,
borderColor: 'rgba(255,140,0,0.35)',
marginBottom: 14,
},

input: {
width: '100%',
minHeight: 46,
backgroundColor: '#111111',
borderRadius: 10,
borderWidth: 1,
borderColor: '#333333',
color: '#FFFFFF',
paddingHorizontal: 13,
fontSize: 14,
marginBottom: 9,
},

messageInput: {
minHeight: 95,
paddingTop: 12,
},

characterCount: {
color: '#666666',
fontSize: 10,
textAlign: 'right',
marginTop: -4,
marginBottom: 9,
},

orangeButton: {
width: '100%',
minHeight: 46,
backgroundColor: '#FF8C00',
borderRadius: 11,
alignItems: 'center',
justifyContent: 'center',
shadowColor: '#000000',
shadowOffset: {
width: 0,
height: 3,
},
shadowOpacity: 0.4,
shadowRadius: 4,
elevation: 4,
},

buttonPressed: {
opacity: 0.8,
transform: [{ scale: 0.98 }],
},

orangeButtonText: {
color: '#FFFFFF',
fontSize: 13,
fontWeight: '900',
letterSpacing: 0.7,
textShadowColor: 'rgba(0,0,0,0.7)',
textShadowOffset: {
width: 1,
height: 1,
},
textShadowRadius: 2,
},

messagesList: {
width: '100%',
},

messageRow: {
width: '100%',
flexDirection: 'row',
backgroundColor: 'rgba(17,17,17,0.9)',
borderRadius: 12,
borderWidth: 1,
borderColor: '#292929',
padding: 12,
marginBottom: 8,
},

avatar: {
width: 38,
height: 38,
borderRadius: 19,
backgroundColor: '#FF8C00',
alignItems: 'center',
justifyContent: 'center',
marginRight: 10,
},

avatarText: {
color: '#FFFFFF',
fontSize: 15,
fontWeight: '900',
textShadowColor: 'rgba(0,0,0,0.7)',
textShadowOffset: {
width: 1,
height: 1,
},
textShadowRadius: 2,
},

messageContent: {
flex: 1,
},

messageHeader: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 4,
},

messageName: {
color: '#FFFFFF',
fontSize: 13,
fontWeight: '900',
flex: 1,
},

messageDate: {
color: '#666666',
fontSize: 9,
marginLeft: 8,
},

messageText: {
color: '#CCCCCC',
fontSize: 13,
lineHeight: 19,
},

emptyMessages: {
backgroundColor: 'rgba(17,17,17,0.9)',
borderRadius: 12,
padding: 18,
alignItems: 'center',
},

emptyMessagesText: {
color: '#CCCCCC',
fontSize: 12,
fontWeight: '900',
textAlign: 'center',
},

emptyMessagesSubtext: {
color: '#777777',
fontSize: 11,
marginTop: 5,
},

aboutCard: {
width: '100%',
backgroundColor: 'rgba(0,0,0,0.72)',
borderRadius: 18,
padding: 18,
marginTop: 0,
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

emptyLeaderboard: {
backgroundColor: 'rgba(17,17,17,0.9)',
borderRadius: 12,
padding: 18,
alignItems: 'center',
},

footer: {
color: '#777777',
fontSize: 11,
fontWeight: '800',
letterSpacing: 1.5,
textAlign: 'center',
marginTop: 20,
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