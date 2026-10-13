/**
 * Dumbbell Dash oyun motoru: fizik, engel uretimi, carpisma ve skor. Saf TypeScript; React'e,
 * zamanlayicilara veya ekrana bagli degildir.
 *
 * DETERMINISTIKTIR: Ayni seed ve ayni "zipla" tick listesi her zaman ayni skoru uretir. Sunucu
 * (MerfitCustomerApi, DumbbellDashSimulator.cs) bu motorun birebir C# kopyasiyla oyunu yeniden oynatir
 * ve skoru istemciye guvenmeden kendisi hesaplar. Bu yuzden:
 * - Tum degerler tamsayidir (dunya birimi = 1/1000 "unit"); kayan nokta kullanilmaz.
 * - Rastgelelik yalnizca seed'li mulberry32'den gelir (Math.random kullanilmaz).
 * - Adim sirasi (zipla -> yer cekimi -> hareket -> engel uretimi -> skor -> carpisma) degismemelidir.
 * Bu dosyada kural degisirse C# simulatoru ve iki taraftaki "golden" testler de birlikte guncellenmelidir.
 */

/** Saniyedeki sabit simulasyon adimi. Oyun dongusu gercek zamandan bagimsiz bu hizda ilerler. */
export const TICK_RATE = 60;
export const TICK_MS = 1000 / TICK_RATE;

/** Sunucunun kabul ettigi kural surumu; motor degisirse artirilir (eski istemci reddedilir). */
export const ENGINE_VERSION = 1;

export const WORLD_W = 1_400_000;
export const WORLD_H = 1_000_000;
export const GROUND_H = 70_000;
export const GROUND_Y = WORLD_H - GROUND_H;

export const PLAYER_X = 330_000;
/** Maskotun carpisma kutusunun yari genisligi (gorsel boyuttan biraz kucuk; affedici). */
export const PLAYER_HALF = 38_000;
export const START_Y = 450_000;

export const GRAVITY = 600;
export const FLAP_VY = -10_500;
export const MAX_FALL_VY = 15_000;

/** Engel (dambil) genisligi: ucundaki plakalar bu genislikte, govde (sap) daha ince. */
export const OBSTACLE_W = 120_000;
export const BAR_INSET = 30_000;
export const PLATE_H = 64_000;
export const GAP_H = 300_000;
export const OBSTACLE_SPACING = 560_000;
export const GAP_CENTER_MIN = 230_000;
export const GAP_CENTER_MAX = GROUND_Y - 230_000;
export const MAX_GAP_DELTA = 280_000;

export const BASE_SPEED = 4_800;
export const SPEED_PER_POINT = 40;
export const SPEED_RAMP_CAP = 40;

/** Tek oyunun ust siniri (10 dk). Ulasilirsa oyun biter; sunucu replay'i de bu sinirla calisir. */
export const MAX_TICKS = TICK_RATE * 60 * 10;

export type Obstacle = {
  /** Uretim sirasi; gorsel slot eslestirmesi icin kullanilir. */
  id: number;
  x: number;
  gapTop: number;
  gapBottom: number;
  passed: boolean;
};

export type GameState = {
  tick: number;
  y: number;
  vy: number;
  score: number;
  alive: boolean;
  obstacles: Obstacle[];
  nextObstacleId: number;
  lastGapCenter: number;
  rng: number;
};

/** Seed'i 32 bit isaretsiz tamsayiya indirger (sunucu da ayni sekilde uint kullanir). */
export function normalizeSeed(seed: number): number {
  return Math.trunc(seed) >>> 0;
}

/** mulberry32; C# karsiligi uint aritmetigiyle ayni bitleri uretir. */
export function nextRandom(state: { rng: number }): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

function nextGapCenter(state: GameState, previous: number | null): number {
  const range = GAP_CENTER_MAX - GAP_CENTER_MIN;
  let center = GAP_CENTER_MIN + (nextRandom(state) % (range + 1));
  if (previous !== null) {
    center = Math.min(Math.max(center, previous - MAX_GAP_DELTA), previous + MAX_GAP_DELTA);
  }
  return center;
}

function spawnObstacle(state: GameState, x: number, previousCenter: number | null) {
  const center = nextGapCenter(state, previousCenter);
  state.obstacles.push({
    id: state.nextObstacleId,
    x,
    gapTop: center - GAP_H / 2,
    gapBottom: center + GAP_H / 2,
    passed: false,
  });
  state.nextObstacleId += 1;
  state.lastGapCenter = center;
}

export function createGame(seed: number): GameState {
  const state: GameState = {
    tick: 0,
    y: START_Y,
    vy: 0,
    score: 0,
    alive: true,
    obstacles: [],
    nextObstacleId: 0,
    lastGapCenter: 0,
    rng: normalizeSeed(seed),
  };
  spawnObstacle(state, WORLD_W, null);
  return state;
}

export function currentSpeed(score: number): number {
  return BASE_SPEED + Math.min(score, SPEED_RAMP_CAP) * SPEED_PER_POINT;
}

/** Iki yatay araligin (yari acik) kesisip kesismedigi. */
function overlapsX(left: number, right: number): boolean {
  return left < PLAYER_X + PLAYER_HALF && right > PLAYER_X - PLAYER_HALF;
}

/** Maskot verilen engele carpiyor mu? Ince sap ve ucundaki genis plakalar ayri kutulardir. */
export function hitsObstacle(y: number, obstacle: Obstacle): boolean {
  const top = y - PLAYER_HALF;
  const bottom = y + PLAYER_HALF;
  const x = obstacle.x;

  if (overlapsX(x + BAR_INSET, x + OBSTACLE_W - BAR_INSET)) {
    if (top < obstacle.gapTop || bottom > obstacle.gapBottom) return true;
  }
  if (overlapsX(x, x + OBSTACLE_W)) {
    const hitsTopPlate = top < obstacle.gapTop && bottom > obstacle.gapTop - PLATE_H;
    const hitsBottomPlate = bottom > obstacle.gapBottom && top < obstacle.gapBottom + PLATE_H;
    if (hitsTopPlate || hitsBottomPlate) return true;
  }
  return false;
}

/**
 * Tek simulasyon adimi. `flap` true ise bu adimda ziplanir. Oyun bittiyse hicbir sey yapmaz.
 * Performans icin state yerinde (mutable) guncellenir.
 */
export function step(state: GameState, flap: boolean): void {
  if (!state.alive) return;

  if (flap) state.vy = FLAP_VY;
  state.vy = Math.min(state.vy + GRAVITY, MAX_FALL_VY);
  state.y += state.vy;

  const speed = currentSpeed(state.score);
  for (const obstacle of state.obstacles) obstacle.x -= speed;

  while (state.obstacles.length > 0 && state.obstacles[0].x + OBSTACLE_W < 0) {
    state.obstacles.shift();
  }
  const last = state.obstacles[state.obstacles.length - 1];
  if (!last) {
    spawnObstacle(state, WORLD_W, state.lastGapCenter);
  } else if (last.x <= WORLD_W - OBSTACLE_SPACING) {
    spawnObstacle(state, last.x + OBSTACLE_SPACING, state.lastGapCenter);
  }

  for (const obstacle of state.obstacles) {
    if (!obstacle.passed && obstacle.x + OBSTACLE_W < PLAYER_X - PLAYER_HALF) {
      obstacle.passed = true;
      state.score += 1;
    }
  }

  if (state.y - PLAYER_HALF < 0 || state.y + PLAYER_HALF > GROUND_Y) {
    state.alive = false;
  } else {
    for (const obstacle of state.obstacles) {
      if (hitsObstacle(state.y, obstacle)) {
        state.alive = false;
        break;
      }
    }
  }

  state.tick += 1;
  if (state.tick >= MAX_TICKS) state.alive = false;
}

export type ReplayResult =
  | { valid: true; score: number; ticks: number }
  | { valid: false; reason: "invalid_input" | "input_after_end" };

/**
 * Oyunu seed ve zipla tick'lerinden bastan oynatir (sunucudaki dogrulamanin aynisi). Tick listesi
 * kesin artan, negatif olmayan tamsayilar olmali ve oyun bitmeden once kullanilmis olmalidir.
 */
export function replay(seed: number, flapTicks: readonly number[]): ReplayResult {
  for (let i = 0; i < flapTicks.length; i += 1) {
    const value = flapTicks[i];
    if (!Number.isInteger(value) || value < 0 || (i > 0 && value <= flapTicks[i - 1])) {
      return { valid: false, reason: "invalid_input" };
    }
  }

  const state = createGame(seed);
  let index = 0;
  while (state.alive) {
    const flap = index < flapTicks.length && flapTicks[index] === state.tick;
    if (flap) index += 1;
    step(state, flap);
  }
  if (index < flapTicks.length) return { valid: false, reason: "input_after_end" };
  return { valid: true, score: state.score, ticks: state.tick };
}
