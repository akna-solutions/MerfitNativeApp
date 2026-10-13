import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AccessibilityActionEvent,
  Animated,
  AppState,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../theme/ThemeContext";
import { DumbbellObstacle } from "./components/DumbbellObstacle";
import { Mascot } from "./components/Mascot";
import {
  GROUND_Y,
  MAX_FALL_VY,
  PLAYER_X,
  TICK_MS,
  WORLD_H,
  WORLD_W,
  createGame,
  step,
  type GameState,
} from "./engine";

export type GameOverResult = {
  score: number;
  ticks: number;
  /** Ziplamanin uygulandigi tick'ler; sunucu bunlarla oyunu yeniden oynatir. */
  flapTicks: number[];
};

type Status = "ready" | "running" | "paused" | "over";

type Props = {
  seed: number;
  /** false iken (oturum hazirlaniyor) baslatma dokunusu kabul edilmez. */
  canStart: boolean;
  /** true iken oyun ilerlemez ve devam ettirilemez (orn. antrenman duraklatildi). */
  suspended?: boolean;
  /** Degistiginde oyun calisiyorsa bir kez duraklatilir (orn. dinlenme suresi doldu). */
  pauseSignal?: number;
  /** Duraklama ekraninda gosterilecek aciklama. */
  pausedHint?: string;
  onGameOver: (result: GameOverResult) => void;
  onRunningChange?: (running: boolean) => void;
};

/** Ayni anda ekranda olabilecek en fazla engel (dunya genisligi / engel araligi + 1). */
const SLOT_COUNT = 4;
/** Bir karede islenecek en fazla adim; takilma sonrasi "isinlanma"yi onler. */
const MAX_STEPS_PER_FRAME = 4;
/** Bundan uzun kare araliklari (JS takilmasi) oyunu ileri sarmaz, yavaslatir. */
const MAX_FRAME_MS = 100;
const MASCOT_WORLD_SIZE = 104_000;
const OFFSCREEN_X = -10_000;

type Slot = { id: number; gapTop: number; gapBottom: number } | null;

/**
 * Dumbbell Dash oyun alani: dongu, girdi ve cizim. Kurallar engine.ts'tedir.
 *
 * Kaynak yonetimi: requestAnimationFrame dongusu YALNIZCA oyun "running" iken calisir; duraklama, oyun
 * sonu ve unmount'ta iptal edilir. Uygulama arka plana gecince oyun duraklar. Kareler gercek zamandan
 * bagimsiz sabit adimla (60/sn) islenir; konumlar Animated.Value'lara yazilir, React yeniden render'i
 * yalnizca skor/durum degisince ve yeni engel geldiginde olur.
 */
export function DumbbellDashGame({
  seed,
  canStart,
  suspended = false,
  pauseSignal,
  pausedHint,
  onGameOver,
  onRunningChange,
}: Props) {
  const { colors } = useTheme();

  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [boardWidth, setBoardWidth] = useState(0);
  const [slots, setSlots] = useState<Slot[]>(() => Array<Slot>(SLOT_COUNT).fill(null));

  // Her tur yeni bir bilesen ornegidir (ust bilesen key ile yeniden olusturur); seed tur boyunca sabittir.
  const [initialGame] = useState<GameState>(() => createGame(seed));
  const gameRef = useRef<GameState>(initialGame);
  const statusRef = useRef<Status>("ready");
  const flapsRef = useRef<number[]>([]);
  const pendingFlapRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const scaleRef = useRef(0);
  const slotIdsRef = useRef<(number | null)[]>(Array<number | null>(SLOT_COUNT).fill(null));
  const reportedRef = useRef(false);

  const [playerY] = useState(() => new Animated.Value(0));
  const [playerTilt] = useState(() => new Animated.Value(0));
  const [obstacleX] = useState(() => Array.from({ length: SLOT_COUNT }, () => new Animated.Value(OFFSCREEN_X)));

  const onGameOverRef = useRef(onGameOver);
  const onRunningChangeRef = useRef(onRunningChange);
  useLayoutEffect(() => {
    onGameOverRef.current = onGameOver;
    onRunningChangeRef.current = onRunningChange;
  }, [onGameOver, onRunningChange]);

  // requestAnimationFrame'e verilen sabit fonksiyon; her karede guncel `frame`i cagirir.
  const frameRef = useRef<(now: number) => void>(() => {});
  const tick = useCallback((now: number) => frameRef.current(now), []);

  const scale = boardWidth / WORLD_W;
  const boardHeight = boardWidth * (WORLD_H / WORLD_W);
  const mascotSize = MASCOT_WORLD_SIZE * scale;

  const changeStatus = useCallback((next: Status) => {
    if (statusRef.current === next) return;
    const wasRunning = statusRef.current === "running";
    statusRef.current = next;
    setStatus(next);
    if (wasRunning !== (next === "running")) onRunningChangeRef.current?.(next === "running");
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
    accumulatorRef.current = 0;
  }, []);

  /** Motor durumunu ekrana yansitir (React render'i olmadan). */
  const draw = useCallback(() => {
    const s = scaleRef.current;
    const game = gameRef.current;
    if (s <= 0) return;

    playerY.setValue(game.y * s);
    playerTilt.setValue(Math.max(-25, Math.min(70, (game.vy / MAX_FALL_VY) * 70)));

    const nextIds: (number | null)[] = Array<number | null>(SLOT_COUNT).fill(null);
    for (const obstacle of game.obstacles) {
      const slot = obstacle.id % SLOT_COUNT;
      nextIds[slot] = obstacle.id;
      obstacleX[slot].setValue(obstacle.x * s);
    }
    let changed = false;
    for (let i = 0; i < SLOT_COUNT; i += 1) {
      if (nextIds[i] === null) obstacleX[i].setValue(OFFSCREEN_X);
      if (nextIds[i] !== slotIdsRef.current[i]) changed = true;
    }
    if (changed) {
      slotIdsRef.current = nextIds;
      setSlots(
        nextIds.map((id) => {
          const obstacle = id === null ? undefined : game.obstacles.find((o) => o.id === id);
          return obstacle ? { id: obstacle.id, gapTop: obstacle.gapTop, gapBottom: obstacle.gapBottom } : null;
        }),
      );
    }
  }, [obstacleX, playerTilt, playerY]);

  const finish = useCallback(() => {
    stopLoop();
    changeStatus("over");
    if (reportedRef.current) return;
    reportedRef.current = true;
    const game = gameRef.current;
    onGameOverRef.current({ score: game.score, ticks: game.tick, flapTicks: [...flapsRef.current] });
  }, [changeStatus, stopLoop]);

  const frame = useCallback(
    (now: number) => {
      rafRef.current = null;
      if (statusRef.current !== "running") return;

      const game = gameRef.current;
      const elapsed = lastFrameRef.current === null ? 0 : Math.min(MAX_FRAME_MS, now - lastFrameRef.current);
      lastFrameRef.current = now;
      let accumulator = accumulatorRef.current + elapsed;
      let steps = 0;
      const scoreBefore = game.score;

      while (accumulator >= TICK_MS && steps < MAX_STEPS_PER_FRAME && game.alive) {
        // Iki adim arasindaki birden fazla dokunus tek ziplamaya indirgenir (hizli art arda dokunma).
        const flap = pendingFlapRef.current;
        pendingFlapRef.current = false;
        if (flap) flapsRef.current.push(game.tick);
        step(game, flap);
        accumulator -= TICK_MS;
        steps += 1;
      }
      accumulatorRef.current = steps === MAX_STEPS_PER_FRAME ? Math.min(accumulator, TICK_MS) : accumulator;

      draw();
      if (game.score !== scoreBefore) setScore(game.score);

      if (!game.alive) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [draw, finish, tick],
  );
  useLayoutEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    lastFrameRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    stopLoop();
    pendingFlapRef.current = false;
    changeStatus("paused");
  }, [changeStatus, stopLoop]);

  const handleTap = useCallback(() => {
    const current = statusRef.current;
    if (current === "running") {
      pendingFlapRef.current = true;
      return;
    }
    if (current === "ready" && canStart && !suspended) {
      pendingFlapRef.current = true;
      changeStatus("running");
      startLoop();
      return;
    }
    if (current === "paused" && !suspended) {
      changeStatus("running");
      startLoop();
    }
  }, [canStart, changeStatus, startLoop, suspended]);

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === "activate") handleTap();
    },
    [handleTap],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = Math.round(event.nativeEvent.layout.width);
      setBoardWidth((prev) => (prev === width ? prev : width));
      scaleRef.current = width / WORLD_W;
      draw();
    },
    [draw],
  );

  // Uygulama arka plana gecerse/kilitlenirse oyun guvenle duraklar; donuste kullanici dokununca devam eder.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") pause();
    });
    return () => subscription.remove();
  }, [pause]);

  useEffect(() => {
    if (suspended) pause();
  }, [suspended, pause]);

  const lastPauseSignal = useRef(pauseSignal);
  useEffect(() => {
    if (pauseSignal !== lastPauseSignal.current) {
      lastPauseSignal.current = pauseSignal;
      pause();
    }
  }, [pauseSignal, pause]);

  // Kapatma / yeniden baslatma (remount) / ekrandan ayrilma: dongu ve dinleyiciler temizlenir.
  useEffect(
    () => () => {
      if (statusRef.current === "running") onRunningChangeRef.current?.(false);
      statusRef.current = "over";
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  const translateX = PLAYER_X * scale - mascotSize / 2;
  const tilt = playerTilt.interpolate({ inputRange: [-90, 90], outputRange: ["-90deg", "90deg"] });
  const mascotTranslateY = Animated.subtract(playerY, mascotSize / 2);

  return (
    <View
      testID="dumbbell-dash-board"
      style={[styles.board, boardWidth > 0 ? { height: boardHeight } : styles.boardPlaceholder]}
      onLayout={handleLayout}
      onTouchStart={handleTap}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Dumbbell Dash, skor ${score}`}
      accessibilityHint="Maskotu zıplatmak için dokun"
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={handleAccessibilityAction}
    >
      {boardWidth > 0 ? (
        <>
          <View style={[styles.ground, { top: GROUND_Y * scale }]}>
            <View style={styles.groundLine} />
          </View>

          {slots.map((slot, index) =>
            slot ? (
              <Animated.View key={slot.id} style={[styles.obstacle, { transform: [{ translateX: obstacleX[index] }] }]}>
                <DumbbellObstacle scale={scale} gapTop={slot.gapTop} gapBottom={slot.gapBottom} />
              </Animated.View>
            ) : null,
          )}

          <Animated.View
            style={[
              styles.mascot,
              { width: mascotSize, height: mascotSize, transform: [{ translateX }, { translateY: mascotTranslateY }, { rotate: tilt }] },
            ]}
          >
            <Mascot size={mascotSize} />
          </Animated.View>

          <Text style={styles.score} testID="dumbbell-dash-score">
            {score}
          </Text>

          {status !== "running" ? (
            <View style={styles.overlay} pointerEvents="none">
              <Text style={styles.overlayTitle}>{overlayTitle(status, canStart, suspended, pausedHint)}</Text>
              {status === "ready" && canStart ? (
                <Text style={styles.overlayHint}>Dambıllara ve kenarlara çarpma</Text>
              ) : null}
              {status === "paused" && !suspended ? <Text style={styles.overlayHint}>Devam etmek için dokun</Text> : null}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function overlayTitle(status: Status, canStart: boolean, suspended: boolean, pausedHint?: string): string {
  if (status === "ready") return canStart ? "Başlamak için dokun" : "Hazırlanıyor…";
  if (status === "paused") return pausedHint ?? (suspended ? "Duraklatıldı" : "Oyun duraklatıldı");
  return "Oyun bitti";
}

const styles = StyleSheet.create({
  board: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0E1014",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  boardPlaceholder: { aspectRatio: WORLD_W / WORLD_H },
  ground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#16191F",
  },
  groundLine: { height: 2, backgroundColor: "rgba(255,255,255,0.12)" },
  obstacle: { position: "absolute", top: 0, left: 0 },
  mascot: { position: "absolute", top: 0, left: 0 },
  score: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,5,7,0.45)",
    paddingHorizontal: 16,
  },
  overlayTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", textAlign: "center" },
  overlayHint: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 6, textAlign: "center" },
});
