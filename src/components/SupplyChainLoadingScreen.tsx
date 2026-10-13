import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';
import { brandGradient, colors } from '../theme';

const PHASES = [
  { key: 'inventory', label: 'Inventory & Warehouse', duration: 750 },
  { key: 'logistics', label: 'Procurement & Logistics', duration: 950 },
  { key: 'operations', label: 'Supply Chain Operations', duration: 950 },
  { key: 'workspace', label: 'Preparing Supply Chain Workspace…', duration: 850 },
] as const;

const FADE_MS = 280;
const EASE = Easing.bezier(0.33, 0, 0.2, 1);

/** Full reveal-to-hold duration of one cycle (excludes the loop-back fade), for callers that need
 *  to keep the loader mounted long enough to see every phase at least once. */
export const LOADER_CYCLE_MS = PHASES.reduce((sum, p) => sum + p.duration, 0);

function PackageIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,3 21,8 21,16 12,21 3,16 3,8" stroke={colors.primary} strokeWidth={1.6} strokeLinejoin="round" />
      <Line x1={12} y1={12} x2={12} y2={21} stroke={colors.primary} strokeWidth={1.6} />
      <Line x1={3} y1={8} x2={12} y2={12} stroke={colors.primary} strokeWidth={1.6} />
      <Line x1={21} y1={8} x2={12} y2={12} stroke={colors.primary} strokeWidth={1.6} />
    </Svg>
  );
}

function TruckIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={1} y={7} width={13} height={8} rx={1} stroke={colors.primary} strokeWidth={1.6} />
      <Polygon points="14,10 18,10 21,13 21,15 14,15" stroke={colors.primary} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={6} cy={19} r={2} stroke={colors.primary} strokeWidth={1.6} />
      <Circle cx={17} cy={19} r={2} stroke={colors.primary} strokeWidth={1.6} />
    </Svg>
  );
}

function WorkflowIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={2} width={6} height={6} rx={1} stroke={colors.primary} strokeWidth={1.6} />
      <Line x1={12} y1={8} x2={12} y2={12} stroke={colors.primary} strokeWidth={1.6} />
      <Line x1={5} y1={12} x2={19} y2={12} stroke={colors.primary} strokeWidth={1.6} />
      <Line x1={5} y1={12} x2={5} y2={16} stroke={colors.primary} strokeWidth={1.6} />
      <Line x1={19} y1={12} x2={19} y2={16} stroke={colors.primary} strokeWidth={1.6} />
      <Circle cx={5} cy={19} r={2.5} stroke={colors.primary} strokeWidth={1.6} />
      <Circle cx={19} cy={19} r={2.5} stroke={colors.primary} strokeWidth={1.6} />
    </Svg>
  );
}

function IconTile({ icon, anim, revealFrom, tileSize }: { icon: React.ReactNode; anim: Animated.Value; revealFrom: number; tileSize: number }) {
  const opacity = anim.interpolate({ inputRange: [revealFrom, Math.min(revealFrom + 0.35, 1), 1], outputRange: [0, 1, 1], extrapolate: 'clamp' });
  const scale = anim.interpolate({ inputRange: [revealFrom, Math.min(revealFrom + 0.35, 1), 1], outputRange: [0.75, 1, 1], extrapolate: 'clamp' });
  const glowScale = anim.interpolate({ inputRange: [revealFrom, Math.min(revealFrom + 0.35, 1), 1], outputRange: [0.6, 1, 1], extrapolate: 'clamp' });
  const halo = Math.round(tileSize * 1.55);
  return (
    <View style={[styles.tileWrap, { width: tileSize, height: tileSize }]}>
      <Animated.View style={[styles.glow, { width: halo, height: halo, borderRadius: halo / 2, opacity: Animated.multiply(opacity, 0.2), transform: [{ scale: glowScale }] }]} />
      <Animated.View style={[styles.tile, { width: tileSize, height: tileSize, borderRadius: tileSize * 0.28, opacity, transform: [{ scale }] }]}>
        {icon}
      </Animated.View>
    </View>
  );
}

function Connector({ anim, width }: { anim: Animated.Value; width: number }) {
  const fillScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const dotX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, width], extrapolate: 'clamp' });
  const dotOpacity = anim.interpolate({ inputRange: [0, 0.05, 0.9, 1], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' });
  return (
    <View style={[styles.connector, { width }]}>
      <View style={styles.connectorTrack} />
      <Animated.View style={[styles.connectorFill, { width, transform: [{ scaleX: fillScale }], transformOrigin: 'left' }]} />
      <Animated.View style={[styles.connectorDot, { opacity: dotOpacity, transform: [{ translateX: dotX }] }]} />
    </View>
  );
}

export default function SupplyChainLoadingScreen({ statusLabel }: { statusLabel?: string }) {
  const { width: screenWidth } = useWindowDimensions();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [packageAnim] = useState(() => new Animated.Value(0));
  const [truckAnim] = useState(() => new Animated.Value(0));
  const [workflowAnim] = useState(() => new Animated.Value(0));
  const [shimmer] = useState(() => new Animated.Value(0));
  const [motionChecked, setMotionChecked] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        if (!mounted.current) return;
        setReducedMotion(!!v);
        setMotionChecked(true);
      })
      .catch(() => mounted.current && setMotionChecked(true));
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => mounted.current && setReducedMotion(v));
    return () => {
      mounted.current = false;
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    // Wait for the real reduce-motion preference before animating anything, so devices with it
    // enabled never see the full-motion cycle start and then get yanked into the static state.
    if (!motionChecked) return;

    let cancelled = false;
    packageAnim.stopAnimation();
    truckAnim.stopAnimation();
    workflowAnim.stopAnimation();

    if (reducedMotion) {
      packageAnim.setValue(1);
      truckAnim.setValue(1);
      workflowAnim.setValue(1);
      return;
    }

    const runCycle = () => {
      if (!mounted.current || cancelled) return;
      setPhaseIndex(0);
      packageAnim.setValue(0);
      truckAnim.setValue(0);
      workflowAnim.setValue(0);
      Animated.timing(packageAnim, { toValue: 1, duration: PHASES[0].duration, easing: EASE, useNativeDriver: true }).start(() => {
        if (!mounted.current || cancelled) return;
        setPhaseIndex(1);
        Animated.timing(truckAnim, { toValue: 1, duration: PHASES[1].duration, easing: EASE, useNativeDriver: true }).start(() => {
          if (!mounted.current || cancelled) return;
          setPhaseIndex(2);
          Animated.timing(workflowAnim, { toValue: 1, duration: PHASES[2].duration, easing: EASE, useNativeDriver: true }).start(() => {
            if (!mounted.current || cancelled) return;
            setPhaseIndex(3);
            setTimeout(() => {
              if (!mounted.current || cancelled) return;
              Animated.parallel([
                Animated.timing(packageAnim, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
                Animated.timing(truckAnim, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
                Animated.timing(workflowAnim, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
              ]).start(() => runCycle());
            }, PHASES[3].duration);
          });
        });
      });
    };
    runCycle();

    return () => {
      cancelled = true;
      packageAnim.stopAnimation();
      truckAnim.stopAnimation();
      workflowAnim.stopAnimation();
    };
  }, [motionChecked, reducedMotion, packageAnim, truckAnim, workflowAnim]);

  useEffect(() => {
    if (reducedMotion) return;
    if (phaseIndex !== 3) return;
    shimmer.setValue(0);
    const loop = Animated.loop(Animated.timing(shimmer, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [phaseIndex, reducedMotion, shimmer]);

  // Responsive sizing: scale the whole cluster down on narrow phones, cap it on tablets/web.
  const gridMax = Math.min(320, screenWidth - 64);
  const tileSize = Math.max(38, Math.min(48, gridMax * 0.14));
  const iconSize = Math.round(tileSize * 0.5);
  const connectorWidth = Math.max(20, (gridMax - tileSize * 3) / 2);
  const trackWidth = Math.min(130, gridMax * 0.5);
  const chunkWidth = trackWidth * 0.32;

  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-chunkWidth, trackWidth], extrapolate: 'clamp' });
  const effectivePhase = reducedMotion ? 3 : phaseIndex;
  const label = statusLabel || PHASES[effectivePhase].label;

  return (
    <View style={styles.overlay} accessibilityRole="progressbar" accessibilityState={{ busy: true }} accessibilityLabel={`Loading: ${label}`}>
      <View style={[styles.grid, { maxWidth: gridMax }]}>
        <View style={styles.row}>
          <IconTile icon={<PackageIcon size={iconSize} />} anim={packageAnim} revealFrom={0} tileSize={tileSize} />
          <Connector anim={truckAnim} width={connectorWidth} />
          <IconTile icon={<TruckIcon size={iconSize} />} anim={truckAnim} revealFrom={0.55} tileSize={tileSize} />
          <Connector anim={workflowAnim} width={connectorWidth} />
          <IconTile icon={<WorkflowIcon size={iconSize} />} anim={workflowAnim} revealFrom={0.5} tileSize={tileSize} />
        </View>

        <Text style={styles.label} accessibilityLiveRegion="polite">
          {label}
        </Text>

        <View style={[styles.progressTrack, { width: trackWidth, opacity: effectivePhase === 3 ? 1 : 0 }]}>
          <Animated.View
            style={[
              styles.progressChunk,
              { width: chunkWidth },
              reducedMotion ? { transform: [{ translateX: 0 }], width: trackWidth } : { transform: [{ translateX: shimmerX }] },
            ]}
          >
            <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAFBFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    paddingHorizontal: 20,
  },
  grid: { width: '100%', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  tileWrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', backgroundColor: colors.primary },
  tile: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  connector: { height: 10, justifyContent: 'center', marginHorizontal: 2 },
  connectorTrack: { height: 2, borderRadius: 1, backgroundColor: colors.border },
  connectorFill: { position: 'absolute', height: 2, borderRadius: 1, backgroundColor: colors.primary },
  connectorDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginLeft: -3, top: 2 },
  label: { marginTop: 18, fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' },
  progressTrack: { marginTop: 14, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  progressChunk: { position: 'absolute', top: 0, bottom: 0, borderRadius: 2, overflow: 'hidden' },
});
