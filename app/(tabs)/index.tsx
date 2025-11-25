import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
// ADMOB İMPORTLARI
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const { width, height } = Dimensions.get('window');

// --- REKLAM KİMLİKLERİ ---
// Geliştirme modunda test ID, gerçekte senin ID'n kullanılır
const adUnitId = __DEV__ 
  ? TestIds.BANNER 
  : 'ca-app-pub-4816381866965413/3869006552';

// --- SABİTLER VE RENKLER ---
const THEME_COLOR = '#0d9488'; // Teal-600
const BG_COLOR = '#111827'; // Gray-900
const CARD_BG = '#1f2937'; // Gray-800
const TEXT_COLOR = '#f3f4f6'; // Gray-100
const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

// --- HAZIR ZİKİR LİSTESİ ---
const PRESET_ZIKIRS = [
  { id: 1, title: "Serbest Mod", target: 0 },
  { id: 2, title: "Subhanallah", target: 33 },
  { id: 3, title: "Elhamdülillah", target: 33 },
  { id: 4, title: "Allahuekber", target: 33 },
  { id: 5, title: "Ayet-el Kürsi", target: 313 },
  { id: 6, title: "Kelime-i Tevhid", target: 100 },
  { id: 7, title: "Salavat-ı Şerife", target: 100 },
  { id: 8, title: "Ya Fettah", target: 489 },
  { id: 9, title: "Hasbunallah", target: 450 },
];

// --- KONFETİ PARÇACIĞI BİLEŞENİ ---
const ConfettiPiece = ({ index, active }: { index: number, active: boolean }) => {
  const randomX = Math.random() * width;
  const randomDelay = Math.random() * 500;
  const randomDuration = 2000 + Math.random() * 1000;
  
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      translateY.value = -50;
      opacity.value = 1;
      
      translateY.value = withDelay(randomDelay, withTiming(height + 50, { 
        duration: randomDuration,
        easing: Easing.linear
      }));
      
      rotate.value = withDelay(randomDelay, withRepeat(withTiming(360, { duration: 1000 }), -1));
      
      opacity.value = withDelay(randomDelay + randomDuration - 500, withTiming(0, { duration: 500 }));
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: randomX },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` }
    ],
    opacity: opacity.value,
    backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  }));

  if (!active) return null;

  return <Animated.View style={[styles.confetti, style]} />;
};

// --- ANA EKRAN ---
export default function HomeScreen() {
  // --- STATE'LER ---
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [zikirTitle, setZikirTitle] = useState("Zikirmatik");
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Animasyon Değerleri
  const buttonScale = useSharedValue(1);
  const progressHeight = useSharedValue(0);

  // --- BAŞLANGIÇ ---
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
    const percent = target > 0 ? Math.min(count / target, 1) : 0;
    progressHeight.value = withTiming(percent * 100, { duration: 300 });
  }, [count, target, isVibrationEnabled, zikirTitle]);

  // --- VERİ YÖNETİMİ ---
  const loadData = async () => {
    try {
      const [c, t, v, z] = await Promise.all([
        AsyncStorage.getItem('zikirCount'),
        AsyncStorage.getItem('zikirTarget'),
        AsyncStorage.getItem('zikirVib'),
        AsyncStorage.getItem('zikirTitle')
      ]);
      if (c) setCount(parseInt(c));
      if (t) setTarget(parseInt(t));
      if (v) setIsVibrationEnabled(v === 'true');
      if (z) setZikirTitle(z);
    } catch (e) { console.log(e); }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.multiSet([
        ['zikirCount', count.toString()],
        ['zikirTarget', target.toString()],
        ['zikirVib', isVibrationEnabled.toString()],
        ['zikirTitle', zikirTitle]
      ]);
    } catch (e) { console.log(e); }
  };

  // --- İŞLEMLER ---
  const handlePress = () => {
    buttonScale.value = withSequence(withSpring(0.85, { damping: 10 }), withSpring(1));
    
    const newCount = count + 1;
    setCount(newCount);

    if (isVibrationEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (target > 0 && newCount % target === 0) {
      startCelebration();
    }
  };

  const startCelebration = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTriggerConfetti(true);
    setShowCelebration(true);
    setTimeout(() => setTriggerConfetti(false), 4000);
  };

  const handleReset = () => {
    Alert.alert("Sıfırlama", "Sayacı sıfırlamak istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { 
        text: "Sıfırla", 
        style: "destructive", 
        onPress: () => {
          setCount(0);
          setShowSettings(false);
          if (isVibrationEnabled && Platform.OS !== 'web') {
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        } 
      }
    ]);
  };

  const selectPreset = (preset: any) => {
    setZikirTitle(preset.title);
    setTarget(preset.target);
    setCount(0);
    setShowList(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    height: `${progressHeight.value}%`
  }));

  return (
    <View style={styles.container}>
      
      {triggerConfetti && Array.from({ length: 30 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} active={triggerConfetti} />
      ))}

      <View style={styles.topBar}>
        <View>
           <Text style={styles.appName}>{zikirTitle}</Text>
           <Text style={styles.appVersion}>PRO</Text>
        </View>
        <View style={styles.topIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowList(true)}>
            <Ionicons name="list" size={24} color={TEXT_COLOR} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowSettings(true)}>
            <Ionicons name="options" size={24} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        
        <View style={styles.card}>
          <View style={styles.screen}>
             <Text style={styles.ghostNumbers}>88888</Text>
             <Text style={styles.counter}>{count.toString().padStart(5, '0')}</Text>
             <View style={styles.lcdGlare} />
          </View>
          
          <View style={styles.targetInfo}>
            <Ionicons name="flag" size={14} color="#9ca3af" />
            <Text style={styles.targetText}>
              {target === 0 ? "SERBEST MOD" : `HEDEF: ${target}`}
            </Text>
          </View>

          <View style={styles.sideProgressContainer}>
            <Animated.View style={[styles.sideProgressFill, animatedProgressStyle]} />
          </View>
        </View>

        <View style={styles.buttonArea}>
          <TouchableWithoutFeedback onPress={handlePress}>
            <Animated.View style={[styles.mainButton, animatedButtonStyle]}>
              <View style={styles.mainButtonInner}>
                 <Ionicons name="finger-print" size={60} color="rgba(0,0,0,0.1)" />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
          
        </View>

      </View>

      {/* ZİKİR LİSTESİ MODALI */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showList}
        onRequestClose={() => setShowList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Hazır Listeler</Text>
                <TouchableOpacity onPress={() => setShowList(false)}>
                   <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
             </View>
             <ScrollView style={{ maxHeight: 400 }}>
                {PRESET_ZIKIRS.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.presetItem}
                    onPress={() => selectPreset(item)}
                  >
                     <View>
                        <Text style={styles.presetTitle}>{item.title}</Text>
                        <Text style={styles.presetSub}>Hedef: {item.target === 0 ? 'Yok' : item.target}</Text>
                     </View>
                     <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>
        </View>
      </Modal>

      {/* KUTLAMA MODALI */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCelebration}
        onRequestClose={() => setShowCelebration(false)}
      >
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationCard}>
             <Ionicons name="trophy" size={60} color="#fbbf24" />
             <Text style={styles.celebrationTitle}>Maşallah!</Text>
             <Text style={styles.celebrationText}>{target} sayısına ulaştın.</Text>
             <TouchableOpacity 
               style={styles.celebrationButton} 
               onPress={() => setShowCelebration(false)}
             >
               <Text style={styles.celebrationButtonText}>Devam Et</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AYARLAR MODALI */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSettings}
        onRequestClose={() => setShowSettings(false)}
      >
         <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={styles.modalOverlay}>
               <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Ayarlar</Text>
                     <TouchableOpacity onPress={() => setShowSettings(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                     </TouchableOpacity>
                  </View>

                  <View style={styles.settingItem}>
                     <Text style={styles.settingLabel}>Başlık</Text>
                     <TextInput 
                        style={styles.textInput}
                        value={zikirTitle}
                        onChangeText={setZikirTitle}
                        placeholder="Örn: Ya Sabır"
                     />
                  </View>

                  <View style={styles.settingItem}>
                     <Text style={styles.settingLabel}>Hedef Sayısı</Text>
                     <TextInput 
                        style={[styles.textInput, { width: 80, textAlign: 'center' }]}
                        keyboardType="number-pad"
                        value={target.toString()}
                        onChangeText={(t) => {
                           const val = parseInt(t);
                           if (!isNaN(val) && val >= 0) setTarget(val);
                           else if (t === '') setTarget(0);
                        }}
                     />
                  </View>

                  <View style={styles.settingItem}>
                     <Text style={styles.settingLabel}>Titreşim</Text>
                     <Switch 
                        value={isVibrationEnabled} 
                        onValueChange={setIsVibrationEnabled}
                        trackColor={{ true: THEME_COLOR }}
                     />
                  </View>

                  <TouchableOpacity style={styles.resetButtonFull} onPress={handleReset}>
                     <Text style={styles.resetButtonText}>Sayacı Sıfırla</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </TouchableWithoutFeedback>
      </Modal>

      {/* --- REKLAM ALANI (GOOGLE ADMOB) --- */}
      <View style={styles.adContainer}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  // TOP BAR
  topBar: {
    marginTop: 50,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_COLOR,
    letterSpacing: 1,
    maxWidth: 200,
  },
  appVersion: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME_COLOR,
    letterSpacing: 3,
  },
  iconButton: {
    padding: 8,
    backgroundColor: CARD_BG,
    borderRadius: 12,
  },
  // CONTENT
  content: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 40,
  },
  card: {
    width: width * 0.85,
    backgroundColor: CARD_BG,
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  screen: {
    width: '100%',
    height: 100,
    backgroundColor: '#94a3b8', // LCD Background
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    overflow: 'hidden',
    marginBottom: 15,
  },
  lcdGlare: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '45deg' }]
  },
  counter: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 64,
    color: '#111827',
    fontWeight: '700',
    zIndex: 2,
  },
  ghostNumbers: {
    position: 'absolute',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 64,
    color: '#111827',
    opacity: 0.05,
    right: 20,
    zIndex: 1,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  targetText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  // YAN PROGRESS BAR
  sideProgressContainer: {
    position: 'absolute',
    right: 10,
    top: 25,
    bottom: 25,
    width: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  sideProgressFill: {
    width: '100%',
    backgroundColor: THEME_COLOR,
    borderRadius: 3,
  },
  // BUTON
  buttonArea: {
    alignItems: 'center',
    gap: 20,
  },
  mainButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  mainButtonInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapHint: {
    color: '#6b7280',
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.8,
  },
  // MODAL ORTAK STİLLER
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 50,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  // LİSTE ÖĞELERİ
  presetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  presetSub: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // AYARLAR ÖĞELERİ
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  textInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    minWidth: 50,
  },
  resetButtonFull: {
    backgroundColor: '#fee2e2',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // CELEBRATION MODAL
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationCard: {
    backgroundColor: '#fff',
    width: width * 0.8,
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 20,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d97706',
    marginTop: 15,
    marginBottom: 5,
  },
  celebrationText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 25,
  },
  celebrationButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  celebrationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // KONFETİ
  confetti: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 999,
  },
  // REKLAM KUTUSU
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG_COLOR, // Arkaplanla uyumlu
    paddingVertical: 50,
  }
});