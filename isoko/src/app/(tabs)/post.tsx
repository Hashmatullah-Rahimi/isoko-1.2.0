import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
  useAnimatedStyle,
  withSpring,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/animated/PressableScale';
import { TAB_BAR_SPACE } from '@/components/layout/AnimatedTabBar';
import { Illustration } from '@/components/listings/Illustration';
import { AppText, Button, Chip, Input } from '@/components/ui';
import { appConfig } from '@/config/app';
import { translateStored } from '@/components/listings/specs';
import { CAR_FUELS, CAR_TRANSMISSIONS, CATEGORIES, CATEGORY_LIST, HOUSE_PROPERTY_TYPES, PERIOD_NAME_KEY } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { TranslationKey, useI18n } from '@/i18n';
import { createListing } from '@/services/listings';
import { coordsFromLink, getCurrentPin, googleMapsUrl, isGoogleMapsLink, openUrl } from '@/services/maps';
import { colors, radius, shadow, spacing } from '@/theme';
import type { CategoryId, ListingDetails, PricePeriod, SectionId } from '@/types';
import { formatPrice } from '@/utils/format';

const STEPS: TranslationKey[] = ['post.step.type', 'post.step.photos', 'post.step.details', 'post.step.publish'];

function Progress({ step, color }: { step: number; color: string }) {
  const { t } = useI18n();
  const [trackWidth, setTrackWidth] = useState(0);
  const target = ((step + 1) / STEPS.length) * trackWidth;
  const bar = useAnimatedStyle(() => ({ width: withSpring(target, { damping: 18 }) }));
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.bar, { backgroundColor: color }, bar]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {STEPS.map((s, i) => (
          <AppText key={s} variant="small" color={i <= step ? color : colors.textFaint} style={{ fontSize: 12 }}>
            {i + 1}. {t(s)}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const num = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return v.trim() === '' || Number.isNaN(n) ? undefined : n;
};

/** Owners post a new house, car or accessory in 4 easy steps. */
export default function PostListing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; section?: string }>();
  const { session, isOwner } = useAuth();
  const { t, tn } = useI18n();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CategoryId>('house');
  const [section, setSection] = useState<SectionId>('sale');
  const [accessoryType, setAccessoryType] = useState<string>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(appConfig.currencies[0]);
  const [period, setPeriod] = useState<PricePeriod>('total');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  // Google Maps (optional)
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapLink, setMapLink] = useState('');
  const [locating, setLocating] = useState(false);
  // House
  const [propertyType, setPropertyType] = useState('House');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [area, setArea] = useState('');
  const [furnished, setFurnished] = useState(false);
  const [parking, setParking] = useState(false);
  // Car
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuel, setFuel] = useState('Petrol');
  const [transmission, setTransmission] = useState('Automatic');
  const [seats, setSeats] = useState('');
  // Accessory
  const [condition, setCondition] = useState<'new' | 'used'>('new');
  const [brand, setBrand] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doneId, setDoneId] = useState<string | null>(null);

  const cat = CATEGORIES[category];
  const sectionInfo = cat.sections.find((s) => s.id === section)!;

  // When opened with a preset (e.g. "Post a listing" from the Houses › Rent screen), apply it once.
  const presetKey = `${params.category ?? ''}|${params.section ?? ''}`;
  const [appliedPreset, setAppliedPreset] = useState('');
  if (presetKey !== appliedPreset) {
    setAppliedPreset(presetKey);
    if (params.category === 'house' || params.category === 'car') setCategory(params.category);
    if (params.section === 'sale' || params.section === 'rent' || params.section === 'accessory') setSection(params.section);
  }

  // The price period must fit the section (e.g. "per month" only for rentals).
  const priceSuffix = sectionInfo.periods.includes(period) ? period : sectionInfo.periods[0];

  const details = useMemo<ListingDetails>(() => {
    if (section === 'accessory') return { accessory_type: accessoryType, condition, brand: brand.trim() || undefined };
    if (category === 'house')
      return { property_type: propertyType, bedrooms: num(bedrooms), bathrooms: num(bathrooms), area_m2: num(area), furnished, parking };
    return { make: make.trim(), model: model.trim(), year: num(year), mileage_km: num(mileage), fuel, transmission, seats: num(seats) };
  }, [section, category, accessoryType, condition, brand, propertyType, bedrooms, bathrooms, area, furnished, parking, make, model, year, mileage, fuel, transmission, seats]);

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('post.photosNeeded'), t('post.photosNeededText'));
      return;
    }
    const left = appConfig.maxPhotos - photos.length;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: left,
      quality: appConfig.photoQuality,
    });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, appConfig.maxPhotos));
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('post.cameraNeeded'), t('post.cameraNeededText'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: appConfig.photoQuality });
    if (!res.canceled) setPhotos((p) => [...p, res.assets[0].uri].slice(0, appConfig.maxPhotos));
  };

  const usePhoneLocation = async () => {
    setLocating(true);
    try {
      const p = await getCurrentPin();
      if (p) setPin(p);
      else Alert.alert(t('map.permTitle'), t('map.permText'));
    } catch {
      Alert.alert(t('map.permTitle'), t('map.failed'));
    } finally {
      setLocating(false);
    }
  };

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0 && section === 'accessory' && !accessoryType) e.type = t('post.err.type');
    if (s === 1 && photos.length === 0) e.photos = t('post.err.photos');
    if (s === 2) {
      if (title.trim().length < 3) e.title = t('post.err.title');
      if (num(price) === undefined) e.price = t('post.err.price');
      if (section !== 'accessory' && location.trim().length < 2) e.location = t('post.err.location');
      if (category === 'car' && section !== 'accessory' && !make.trim()) e.make = t('post.err.make');
      if (mapLink.trim() && !isGoogleMapsLink(mapLink)) e.mapLink = t('post.err.mapLink');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const reset = () => {
    setStep(0);
    setPhotos([]);
    setTitle('');
    setPrice('');
    setLocation('');
    setDescription('');
    setPin(null);
    setMapLink('');
    setBedrooms('');
    setBathrooms('');
    setArea('');
    setMake('');
    setModel('');
    setYear('');
    setMileage('');
    setSeats('');
    setBrand('');
    setAccessoryType(undefined);
    setDoneId(null);
    setProgress(0);
  };

  const publish = async () => {
    if (!session) return;
    setPublishing(true);
    // An exact pin from the phone wins; otherwise use coordinates found in the pasted link.
    const coords = pin ?? (mapLink.trim() ? coordsFromLink(mapLink) : null);
    try {
      const created = await createListing(
        session.user.id,
        {
          category,
          section,
          title: title.trim(),
          description: description.trim(),
          price: num(price) ?? 0,
          currency,
          price_period: priceSuffix,
          location: location.trim(),
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          map_url: mapLink.trim() || null,
          details,
          photoUris: photos,
        },
        setProgress,
      );
      setDoneId(created.id);
    } catch (e: any) {
      Alert.alert(t('post.failed'), e?.message ?? t('common.error'));
    } finally {
      setPublishing(false);
    }
  };

  if (!isOwner) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <AppText align="center">{t('post.onlyOwners')}</AppText>
      </View>
    );
  }

  // Success screen
  if (doneId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Animated.View entering={ZoomIn.springify().damping(9)} style={{ alignItems: 'center' }}>
          <Illustration kind="success" size={180} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 6 }}>
          <AppText variant="h1" color={colors.ink} align="center">
            {t('post.liveTitle')}
          </AppText>
          <AppText variant="body" color={colors.textMuted} align="center">
            {t('post.liveText')}
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(320)} style={{ gap: 10, marginTop: spacing.md }}>
          <Button title={t('post.view')} icon="eye-outline" gradient={cat.gradient} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: doneId } })} />
          <Button title={t('post.another')} variant="outline" icon="add" onPress={reset} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: TAB_BAR_SPACE + 20, gap: spacing.lg }}
        >
          <Animated.View entering={FadeInDown.duration(450)} style={{ gap: 4 }}>
            <AppText variant="h1" color={colors.ink}>
              {t('post.title')}
            </AppText>
            <AppText variant="body" color={colors.textMuted}>
              {t(section === 'accessory' ? 'post.sub.accessory' : category === 'house' ? 'post.sub.house' : 'post.sub.car')}
            </AppText>
          </Animated.View>

          <Progress step={step} color={cat.color} />

          {/* STEP 1: What are you listing? */}
          {step === 0 && (
            <Animated.View key="s0" entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={{ gap: spacing.lg }}>
              <AppText variant="h3" color={colors.ink}>
                {t('post.what')}
              </AppText>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {CATEGORY_LIST.map((c) => {
                  const active = c.id === category;
                  return (
                    <PressableScale
                      key={c.id}
                      onPress={() => {
                        setCategory(c.id);
                        setAccessoryType(undefined);
                      }}
                      style={[styles.typeCard, shadow.soft, active && { borderColor: c.color, backgroundColor: c.soft }]}
                    >
                      <Illustration kind={c.id} size={86} />
                      <AppText variant="h3" color={active ? c.color : colors.ink}>
                        {t(c.labelKey)}
                      </AppText>
                      {active && (
                        <Animated.View entering={ZoomIn} style={[styles.check, { backgroundColor: c.color }]}>
                          <Ionicons name="checkmark" size={14} color={colors.white} />
                        </Animated.View>
                      )}
                    </PressableScale>
                  );
                })}
              </View>
              <AppText variant="h3" color={colors.ink}>
                {t('post.isFor')}
              </AppText>
              <View style={{ gap: 10 }}>
                {cat.sections.map((s) => {
                  const active = s.id === section;
                  return (
                    <PressableScale key={s.id} onPress={() => setSection(s.id)} style={[styles.sectionRow, active && { borderColor: cat.color, backgroundColor: cat.soft }]}>
                      <View style={[styles.sectionIcon, { backgroundColor: active ? cat.color : colors.surfaceAlt }]}>
                        <Ionicons name={s.icon} size={20} color={active ? colors.white : colors.textMuted} />
                      </View>
                      <AppText variant="bodyStrong" color={colors.ink} style={{ flex: 1 }}>
                        {t(s.labelKey)}
                      </AppText>
                      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? cat.color : colors.textFaint} />
                    </PressableScale>
                  );
                })}
              </View>
              {section === 'accessory' && (
                <Animated.View entering={FadeIn} style={{ gap: 10 }}>
                  <AppText variant="h3" color={colors.ink}>
                    {t('post.accType')}
                  </AppText>
                  <View style={styles.wrap}>
                    {cat.accessoryTypes.map((a) => (
                      <Chip key={a.id} label={t(a.labelKey)} icon={a.icon} color={cat.color} selected={accessoryType === a.id} onPress={() => setAccessoryType(a.id)} />
                    ))}
                  </View>
                  {errors.type && (
                    <AppText variant="small" color={colors.danger}>
                      {errors.type}
                    </AppText>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* STEP 2: Photos */}
          {step === 1 && (
            <Animated.View key="s1" entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={{ gap: spacing.md }}>
              <AppText variant="h3" color={colors.ink}>
                {t('post.addPhotos', { n: photos.length, max: appConfig.maxPhotos })}
              </AppText>
              <AppText variant="small" color={colors.textMuted}>
                {t('post.photoTip')}
              </AppText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PressableScale onPress={pickPhotos} style={[styles.addPhoto, { borderColor: cat.color, backgroundColor: cat.soft }]}>
                  <Ionicons name="images" size={26} color={cat.color} />
                  <AppText variant="small" color={cat.color}>
                    {t('post.gallery')}
                  </AppText>
                </PressableScale>
                <PressableScale onPress={takePhoto} style={[styles.addPhoto, { borderColor: colors.border }]}>
                  <Ionicons name="camera" size={26} color={colors.textMuted} />
                  <AppText variant="small" color={colors.textMuted}>
                    {t('post.camera')}
                  </AppText>
                </PressableScale>
              </View>
              <View style={styles.wrap}>
                {photos.map((uri, i) => (
                  <Animated.View key={uri} entering={ZoomIn.delay(i * 40)} exiting={ZoomOut} layout={LinearTransition} style={styles.thumb}>
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    {i === 0 && (
                      <View style={[styles.cover, { backgroundColor: cat.color }]}>
                        <AppText variant="small" color={colors.white} style={{ fontSize: 10 }}>
                          {t('post.cover')}
                        </AppText>
                      </View>
                    )}
                    <PressableScale onPress={() => setPhotos((p) => p.filter((x) => x !== uri))} style={styles.remove}>
                      <Ionicons name="close" size={14} color={colors.white} />
                    </PressableScale>
                    {i > 0 && (
                      <PressableScale onPress={() => setPhotos((p) => [uri, ...p.filter((x) => x !== uri)])} style={styles.makeCover}>
                        <Ionicons name="star-outline" size={13} color={colors.white} />
                      </PressableScale>
                    )}
                  </Animated.View>
                ))}
              </View>
              {errors.photos && (
                <AppText variant="small" color={colors.danger}>
                  {errors.photos}
                </AppText>
              )}
            </Animated.View>
          )}

          {/* STEP 3: Details */}
          {step === 2 && (
            <Animated.View key="s2" entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={{ gap: spacing.md }}>
              <Input
                label={t('post.titleField')}
                placeholder={t(section === 'accessory' ? 'post.titlePh.accessory' : category === 'house' ? 'post.titlePh.house' : 'post.titlePh.car')}
                value={title}
                onChangeText={setTitle}
                error={errors.title}
                maxLength={120}
              />
              <Input label={t('post.price')} icon="cash-outline" placeholder="0" keyboardType="numeric" value={price} onChangeText={setPrice} suffix={currency} error={errors.price} />
              <View style={styles.wrap}>
                {appConfig.currencies.map((c) => (
                  <Chip key={c} label={c} selected={currency === c} onPress={() => setCurrency(c)} color={cat.color} />
                ))}
              </View>
              {sectionInfo.periods.length > 1 && (
                <View style={styles.wrap}>
                  {sectionInfo.periods.map((p) => (
                    <Chip key={p} label={t(PERIOD_NAME_KEY[p])} icon="time-outline" selected={priceSuffix === p} onPress={() => setPeriod(p)} color={cat.color} />
                  ))}
                </View>
              )}
              <Input label={t('post.location')} icon="location-outline" placeholder={t('post.locationPh')} value={location} onChangeText={setLocation} error={errors.location} />

              {/* Google Maps (optional) */}
              <View style={[styles.mapBox, { borderColor: pin ? cat.color : colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.sectionIcon, { backgroundColor: cat.soft }]}>
                    <Ionicons name="map" size={20} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong" color={colors.ink}>
                      {t('post.mapTitle')}
                    </AppText>
                    <AppText variant="small" color={colors.textMuted}>
                      {t('post.mapHint')}
                    </AppText>
                  </View>
                </View>
                {pin ? (
                  <Animated.View entering={ZoomIn} style={[styles.pinned, { backgroundColor: cat.soft }]}>
                    <Ionicons name="checkmark-circle" size={20} color={cat.color} />
                    <AppText variant="small" color={colors.ink} style={{ flex: 1 }} onPress={() => openUrl(googleMapsUrl({ ...pin, map_url: null, location }))}>
                      {t('post.mapPinned')}
                    </AppText>
                    <Ionicons name="close-circle" size={22} color={colors.textMuted} onPress={() => setPin(null)} accessibilityLabel={t('common.delete')} />
                  </Animated.View>
                ) : (
                  <Button title={t('post.mapUseMine')} icon="locate" size="md" variant="outline" loading={locating} onPress={usePhoneLocation} />
                )}
                <Input
                  label={t('post.mapLink')}
                  icon="link-outline"
                  placeholder="https://maps.app.goo.gl/…"
                  value={mapLink}
                  onChangeText={setMapLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  error={errors.mapLink}
                  hint={t('post.mapLinkHint')}
                />
              </View>

              {section !== 'accessory' && category === 'house' && (
                <>
                  <AppText variant="small" color={colors.text}>
                    {t('post.propertyType')}
                  </AppText>
                  <View style={styles.wrap}>
                    {HOUSE_PROPERTY_TYPES.map((p) => (
                      <Chip key={p} label={translateStored('ptype', p)} selected={propertyType === p} onPress={() => setPropertyType(p)} color={cat.color} />
                    ))}
                  </View>
                  <View style={styles.row3}>
                    <View style={{ flex: 1 }}>
                      <Input label={t('post.bedrooms')} keyboardType="number-pad" value={bedrooms} onChangeText={setBedrooms} placeholder="0" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label={t('post.bathrooms')} keyboardType="number-pad" value={bathrooms} onChangeText={setBathrooms} placeholder="0" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label={t('post.size')} keyboardType="numeric" value={area} onChangeText={setArea} placeholder="0" suffix="m²" />
                    </View>
                  </View>
                  <View style={styles.wrap}>
                    <Chip label={t('spec.furnished')} icon="cube-outline" selected={furnished} onPress={() => setFurnished((v) => !v)} color={cat.color} />
                    <Chip label={t('spec.parking')} icon="car-outline" selected={parking} onPress={() => setParking((v) => !v)} color={cat.color} />
                  </View>
                </>
              )}

              {section !== 'accessory' && category === 'car' && (
                <>
                  <View style={styles.row3}>
                    <View style={{ flex: 1 }}>
                      <Input label={t('post.make')} placeholder="Toyota" value={make} onChangeText={setMake} error={errors.make} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label={t('post.model')} placeholder="RAV4" value={model} onChangeText={setModel} />
                    </View>
                  </View>
                  <View style={styles.row3}>
                    <View style={{ flex: 1 }}>
                      <Input label={t('post.year')} keyboardType="number-pad" placeholder="2019" value={year} onChangeText={setYear} maxLength={4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label={t('post.mileage')} keyboardType="numeric" placeholder="0" value={mileage} onChangeText={setMileage} suffix="km" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label={t('post.seats')} keyboardType="number-pad" placeholder="5" value={seats} onChangeText={setSeats} />
                    </View>
                  </View>
                  <AppText variant="small" color={colors.text}>
                    {t('post.fuel')}
                  </AppText>
                  <View style={styles.wrap}>
                    {CAR_FUELS.map((f) => (
                      <Chip key={f} label={translateStored('fuel', f)} selected={fuel === f} onPress={() => setFuel(f)} color={cat.color} />
                    ))}
                  </View>
                  <AppText variant="small" color={colors.text}>
                    {t('post.gearbox')}
                  </AppText>
                  <View style={styles.wrap}>
                    {CAR_TRANSMISSIONS.map((g) => (
                      <Chip key={g} label={translateStored('gear', g)} selected={transmission === g} onPress={() => setTransmission(g)} color={cat.color} />
                    ))}
                  </View>
                </>
              )}

              {section === 'accessory' && (
                <>
                  <View style={styles.wrap}>
                    <Chip label={t('spec.new')} icon="sparkles-outline" selected={condition === 'new'} onPress={() => setCondition('new')} color={cat.color} />
                    <Chip label={t('spec.used')} icon="refresh-outline" selected={condition === 'used'} onPress={() => setCondition('used')} color={cat.color} />
                  </View>
                  <Input label={t('post.brand')} placeholder={t('post.brandPh')} value={brand} onChangeText={setBrand} />
                </>
              )}

              <Input label={t('post.description')} multiline placeholder={t('post.descriptionPh')} value={description} onChangeText={setDescription} maxLength={2000} />
            </Animated.View>
          )}

          {/* STEP 4: Review */}
          {step === 3 && (
            <Animated.View key="s3" entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={{ gap: spacing.md }}>
              <View style={[styles.preview, shadow.card]}>
                <View style={{ height: 200 }}>
                  {photos[0] && <Image source={{ uri: photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />}
                  <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                  <AppText variant="price" color={colors.white} style={{ position: 'absolute', left: 14, bottom: 12 }}>
                    {formatPrice(num(price) ?? 0, currency, priceSuffix)}
                  </AppText>
                </View>
                <View style={{ padding: 14, gap: 4 }}>
                  <AppText variant="title" color={colors.ink}>
                    {title}
                  </AppText>
                  <AppText variant="small" color={colors.textMuted}>
                    {t(sectionInfo.labelKey)} · {location || '—'} · {tn('post.photos', photos.length)}
                  </AppText>
                  {(pin || mapLink.trim()) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="map" size={13} color={cat.color} />
                      <AppText variant="small" color={cat.color}>
                        {t('post.onMaps')}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
              {publishing && (
                <Animated.View entering={FadeIn} style={{ gap: 6 }}>
                  <View style={styles.track}>
                    <View style={[styles.bar, { backgroundColor: cat.color, width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                  <AppText variant="small" color={colors.textMuted}>
                    {t('post.uploading', { p: Math.round(progress * 100) })}
                  </AppText>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* Navigation buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {step > 0 && (
              <Button title={t('common.back')} variant="outline" icon="arrow-back" style={{ flex: 1 }} onPress={() => setStep((s) => s - 1)} disabled={publishing} />
            )}
            {step < STEPS.length - 1 ? (
              <Button title={t('common.continue')} iconRight="arrow-forward" gradient={cat.gradient} style={{ flex: 2 }} onPress={next} />
            ) : (
              <Button title={t('post.publish')} icon="rocket" variant="gold" style={{ flex: 2 }} onPress={publish} loading={publishing} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  check: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sectionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row3: { flexDirection: 'row', gap: 10 },
  addPhoto: { flex: 1, height: 96, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  thumb: { width: '31.5%', aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  cover: { position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  remove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  makeCover: { position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  mapBox: { gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, backgroundColor: colors.surface },
  pinned: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md },
  preview: { borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
});
