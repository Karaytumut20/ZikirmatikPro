import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// --- ADMOB IMPORTLARI ---
import {
  BannerAd,
  BannerAdSize,
  TestIds
} from 'react-native-google-mobile-ads';

// --- SAFE AREA (GÜVENLİ ALAN) ---
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// --- REKLAM KİMLİĞİ ---
const adUnitId = __DEV__ 
  ? TestIds.BANNER 
  : 'ca-app-pub-4816381866965413/3869006552'; 

// --- RENK PALETİ ---
const THEME_COLOR = '#0d9488'; // Teal-600
const BG_COLOR = '#111827'; // Gray-900
const CARD_BG = '#1f2937'; // Gray-800
const ITEM_BG = '#374151'; // Gray-700
const TEXT_COLOR = '#f3f4f6'; 
const TEXT_SUB = '#9ca3af'; 
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

// --- KONFETİ BİLEŞENİ ---
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
      translateY.value = withDelay(randomDelay, withTiming(height + 50, { duration: randomDuration, easing: Easing.linear }));
      rotate.value = withDelay(randomDelay, withRepeat(withTiming(360, { duration: 1000 }), -1));
      opacity.value = withDelay(randomDelay + randomDuration - 500, withTiming(0, { duration: 500 }));
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: randomX }, { translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
    backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  }));

  if (!active) return null;
  return <Animated.View style={[styles.confetti, style]} />;
};

// --- ANA EKRAN ---
export default function HomeScreen() {
  const insets = useSafeAreaInsets(); // Çentik ve alt çizgi paylarını alır

  const [count, setCount] = useState(0);
  const [totalLifetimeCount, setTotalLifetimeCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [zikirTitle, setZikirTitle] = useState("Zikirmatik");
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  const buttonScale = useSharedValue(1);
  const progressHeight = useSharedValue(0);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    saveData();
    if (target > 0) {
      const remainder = count % target;
      let displayValue = remainder;
      if (count > 0 && remainder === 0) displayValue = target;
      const percent = displayValue / target;
      progressHeight.value = withTiming(percent * 100, { duration: 300 });
    } else {
      progressHeight.value = withTiming(0);
    }
  }, [count, target, isVibrationEnabled, zikirTitle, totalLifetimeCount]);

  const loadData = async () => {
    try {
      const values = await AsyncStorage.multiGet(['zikirCount', 'zikirTarget', 'zikirVib', 'zikirTitle', 'lifetimeCount']);
      if (values[0][1]) setCount(parseInt(values[0][1]));
      if (values[1][1]) setTarget(parseInt(values[1][1]));
      if (values[2][1]) setIsVibrationEnabled(values[2][1] === 'true');
      if (values[3][1]) setZikirTitle(values[3][1]);
      if (values[4][1]) setTotalLifetimeCount(parseInt(values[4][1]));
    } catch (e) {}
  };

  const saveData = async () => {
    try {
      await AsyncStorage.multiSet([
        ['zikirCount', count.toString()],
        ['zikirTarget', target.toString()],
        ['zikirVib', isVibrationEnabled.toString()],
        ['zikirTitle', zikirTitle],
        ['lifetimeCount', totalLifetimeCount.toString()]
      ]);
    } catch (e) {}
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { stiffness: 300, damping: 20 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { stiffness: 300, damping: 20 });
  };

  const handlePress = () => {
    if (count >= 999999) {
      if (isVibrationEnabled && Platform.OS !== 'web') {
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); 
      }
      return; 
    }

    const newCount = count + 1;
    setCount(newCount);
    setTotalLifetimeCount(prev => prev + 1);
    
    if (isVibrationEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (target > 0 && newCount % target === 0) startCelebration();
  };

  const startCelebration = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTriggerConfetti(true);
    setShowCelebration(true);
    setTimeout(() => setTriggerConfetti(false), 4000);
  };

  const handleReset = () => {
    Alert.alert("Sıfırla", "Mevcut sayacı sıfırlamak istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Evet, Sıfırla", style: "destructive", onPress: () => {
        setCount(0);
        if (isVibrationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }}
    ]);
  };

  const selectPreset = (preset: any) => {
    setZikirTitle(preset.title);
    setTarget(preset.target);
    setCount(0);
    setShowList(false);
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));
  const animatedProgressStyle = useAnimatedStyle(() => ({ height: `${progressHeight.value}%` }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* --- REKLAM ALANI (EN ÜSTTE) --- */}
      {/* paddingTop: insets.top diyerek çentik altına itiyoruz */}
      <View style={[styles.adContainer, { paddingTop: insets.top }]}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={(error) => console.log('Ad Error:', error)}
        />
      </View>

      {triggerConfetti && Array.from({ length: 30 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} active={triggerConfetti} />
      ))}

      {/* ÜST BAR (Reklamın altında kalmaması için marginTop verildi) */}
      

      {/* İÇERİK ALANI */}
      <View style={styles.content}>
        
        {/* ZİKİR KARTI */}
        <View style={styles.card}>
          <View style={styles.screen}>
             <Text style={styles.ghostNumbers} adjustsFontSizeToFit numberOfLines={1}>888888</Text>
             <Text style={styles.counter} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>
               {count.toString().padStart(6, '0')}
             </Text>
             <View style={styles.lcdGlare} />
          </View>
          
          <View style={styles.cardInfoRow}>
            <View style={styles.infoChip}>
              <Ionicons name="text" size={18} color={THEME_COLOR} />
              <Text style={styles.infoText} numberOfLines={1}>{zikirTitle}</Text>
            </View>
            <View style={styles.infoChip}>
              <Ionicons name="flag" size={18} color={THEME_COLOR} />
              <Text style={styles.infoText}>{target === 0 ? "∞" : target}</Text>
            </View>
          </View>

          <View style={styles.sideProgressContainer}>
            <Animated.View style={[styles.sideProgressFill, animatedProgressStyle]} />
          </View>
        </View>

        {/* ANA BUTON */}
        <View style={styles.buttonArea}>
          <TouchableWithoutFeedback 
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
          >
            <Animated.View style={[styles.mainButton, animatedButtonStyle]}>
              <View style={styles.mainButtonInner}>
                 <Ionicons name="finger-print" size={80} color="rgba(0,0,0,0.08)" />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>

      </View>

      {/* --- ALT KONTROL PANELİ --- */}
      {/* bottom: insets.bottom ile iPhone'daki alt çizgiden yukarıda tutuyoruz */}
      <View style={[styles.bottomControlBar, { bottom: Math.max(insets.bottom, 20) }]}>
         <TouchableOpacity style={styles.controlButton} onPress={() => setShowList(true)}>
            <View style={styles.iconCircle}>
              <Ionicons name="list" size={22} color={TEXT_COLOR} />
            </View>
            <Text style={styles.controlLabel}>Listeler</Text>
         </TouchableOpacity>

         <View style={styles.divider} />

         <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
            <View style={styles.iconCircle}>
              <Ionicons name="refresh" size={22} color="#ef4444" />
            </View>
            <Text style={[styles.controlLabel, { color: '#ef4444' }]}>Sıfırla</Text>
         </TouchableOpacity>

         <View style={styles.divider} />

         <TouchableOpacity style={styles.controlButton} onPress={() => setShowSettings(true)}>
            <View style={styles.iconCircle}>
              <Ionicons name="settings-sharp" size={22} color={TEXT_COLOR} />
            </View>
            <Text style={styles.controlLabel}>Ayarlar</Text>
         </TouchableOpacity>
      </View>

      {/* MODALLAR */}
      <Modal animationType="slide" transparent={true} visible={showList} onRequestClose={() => setShowList(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
             <View style={styles.modalHandle} />
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Zikir Listesi</Text>
                <TouchableOpacity onPress={() => setShowList(false)} style={styles.closeBtn}>
                   <Ionicons name="close" size={24} color={TEXT_COLOR} />
                </TouchableOpacity>
             </View>
             <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {PRESET_ZIKIRS.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.presetCard} onPress={() => selectPreset(item)}>
                      <View style={styles.presetIconBox}>
                        <Ionicons name="bookmark" size={20} color={THEME_COLOR} />
                      </View>
                      <View style={{flex:1}}>
                         <Text style={styles.presetTitle}>{item.title}</Text>
                         <Text style={styles.presetSub}>Hedef: {item.target === 0 ? 'Serbest' : item.target}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={TEXT_SUB} />
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={showSettings} onRequestClose={() => setShowSettings(false)}>
         <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
               <View style={styles.modalSheet}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Ayarlar</Text>
                     <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={TEXT_COLOR} />
                     </TouchableOpacity>
                  </View>

                  <View style={styles.settingRow}>
                     <Text style={styles.settingLabel}>Hedef Sayısı</Text>
                     <TextInput 
                        style={[styles.darkInput, { width: 100, textAlign: 'center' }]}
                        keyboardType="number-pad"
                        value={target.toString()}
                        onChangeText={(t) => {
                           const val = parseInt(t);
                           setTarget(isNaN(val) ? 0 : val);
                        }}
                     />
                  </View>

                  <View style={styles.settingRow}>
                     <Text style={styles.settingLabel}>Titreşim</Text>
                     <Switch 
                        value={isVibrationEnabled} 
                        onValueChange={setIsVibrationEnabled}
                        trackColor={{ false: '#4b5563', true: THEME_COLOR }}
                        thumbColor="#f3f4f6"
                     />
                  </View>

                  <View style={styles.statsContainer}>
                     <Text style={styles.statsLabel}>GENEL TOPLAM</Text>
                     <Text style={styles.statsValue}>{totalLifetimeCount.toLocaleString()}</Text>
                     <Text style={styles.statsSub}>Uygulama yüklendiğinden beri çekilen zikir</Text>
                  </View>
                  
               </View>
            </View>
         </TouchableWithoutFeedback>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={showCelebration} onRequestClose={() => setShowCelebration(false)}>
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationCard}>
             <Ionicons name="trophy" size={60} color="#fbbf24" />
             <Text style={styles.celebrationTitle}>Maşallah!</Text>
             <Text style={styles.celebrationText}>{target} sayısına ulaştın.</Text>
             <TouchableOpacity style={styles.celebrationButton} onPress={() => setShowCelebration(false)}>
               <Text style={styles.celebrationButtonText}>Devam Et</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  // REKLAM ALANI (EN ÜSTTE)
  adContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: BG_COLOR, 
    zIndex: 9999,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  // TOP BAR (Reklamdan sonra gelir)
  topBar: {
    marginTop: 10, // Reklamın hemen altına biraz boşluk
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
  content: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    paddingBottom: 100, // Alt menü için yer
    gap: 40,
  },
  card: {
    width: width * 0.85,
    backgroundColor: CARD_BG,
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  screen: {
    width: '100%',
    height: 120, 
    backgroundColor: '#94a3b8',
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
    fontSize: 70, 
    color: '#111827',
    fontWeight: '700',
    zIndex: 2,
    width: '100%',
    textAlign: 'right',
  },
  ghostNumbers: {
    position: 'absolute',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 70,
    color: '#111827',
    opacity: 0.05,
    right: 20,
    width: '100%',
    textAlign: 'right',
  },
  cardInfoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
    maxWidth: '60%',
  },
  infoText: {
    color: TEXT_SUB,
    fontSize: 15,
    fontWeight: '800',
  },
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
  buttonArea: {
    alignItems: 'center',
  },
  mainButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  mainButtonInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // KONTROL PANELİ
  bottomControlBar: {
    position: 'absolute',
    // bottom değeri artık dinamik
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  iconCircle: {
    marginBottom: 2,
  },
  controlLabel: {
    color: TEXT_SUB,
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: '40%',
    backgroundColor: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 50,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#4b5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  closeBtn: {
    padding: 5,
    backgroundColor: ITEM_BG,
    borderRadius: 50,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ITEM_BG,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  presetIconBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(13, 148, 136, 0.2)', 
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  presetSub: {
    fontSize: 12,
    color: TEXT_SUB,
    marginTop: 2,
  },
  settingRow: {
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  darkInput: {
    backgroundColor: ITEM_BG,
    color: TEXT_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 60,
  },
  statsContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statsLabel: {
    color: TEXT_SUB,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 5,
  },
  statsValue: {
    color: THEME_COLOR,
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsSub: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 5,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationCard: {
    backgroundColor: CARD_BG,
    width: width * 0.8,
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginTop: 15,
  },
  celebrationText: {
    fontSize: 16,
    color: TEXT_SUB,
    marginVertical: 10,
  },
  celebrationButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  celebrationButtonText: { color: '#fff', fontWeight: 'bold' },
  confetti: { position: 'absolute', width: 10, height: 10, borderRadius: 5, zIndex: 999 },
});