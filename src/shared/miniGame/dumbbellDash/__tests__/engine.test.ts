import golden from "./dumbbellDashGolden.json";
import {
  ENGINE_VERSION,
  FLAP_VY,
  GAP_H,
  GROUND_Y,
  OBSTACLE_W,
  PLAYER_HALF,
  PLAYER_X,
  WORLD_W,
  createGame,
  nextRandom,
  replay,
  step,
  type GameState,
} from "../engine";

/** Engelin ortasindan gecmeye calisan basit bot; skor ilerlemesini test etmek icin. */
function playUntil(state: GameState, targetScore: number, maxTicks = 20_000): number[] {
  const flaps: number[] = [];
  while (state.alive && state.score < targetScore && state.tick < maxTicks) {
    const next = state.obstacles.find((o) => o.x + OBSTACLE_W > PLAYER_X - PLAYER_HALF)!;
    const flap = state.y > next.gapBottom - PLAYER_HALF - 60_000 && state.vy > 0;
    if (flap) flaps.push(state.tick);
    step(state, flap);
  }
  return flaps;
}

describe("Dumbbell Dash motoru", () => {
  it("sunucuyla ayni golden veriyi uretir (mulberry32 ve replay)", () => {
    expect(golden.engineVersion).toBe(ENGINE_VERSION);
    for (const vector of golden.rng) {
      const state = { rng: vector.seed };
      expect(vector.values.map(() => nextRandom(state))).toEqual(vector.values);
    }
    for (const game of golden.games) {
      expect(replay(game.seed, game.flapTicks)).toEqual({ valid: true, score: game.score, ticks: game.ticks });
    }
  });

  it("engel gecildikce skor birer birer artar", () => {
    const state = createGame(2024);
    const scores: number[] = [];
    let last = 0;
    while (state.alive && state.score < 5) {
      const next = state.obstacles.find((o) => o.x + OBSTACLE_W > PLAYER_X - PLAYER_HALF)!;
      step(state, state.y > next.gapBottom - PLAYER_HALF - 60_000 && state.vy > 0);
      if (state.score !== last) {
        scores.push(state.score);
        last = state.score;
      }
    }
    expect(scores).toEqual([1, 2, 3, 4, 5]);
  });

  it("zipla yukari hiz verir, yer cekimi geri indirir", () => {
    const state = createGame(1);
    const startY = state.y;
    step(state, true);
    expect(state.vy).toBeLessThan(0);
    expect(state.y).toBeLessThan(startY);
    expect(state.vy).toBe(FLAP_VY + 600);
    for (let i = 0; i < 40; i += 1) step(state, false);
    expect(state.vy).toBeGreaterThan(0);
  });

  it("zemine carpinca oyun biter ve sonraki adimlar durumu degistirmez", () => {
    const state = createGame(1);
    while (state.alive) step(state, false);
    expect(state.y + PLAYER_HALF).toBeGreaterThan(GROUND_Y);
    const snapshot = JSON.stringify(state);
    step(state, true);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("tavana carpinca oyun biter", () => {
    const state = createGame(1);
    let ticks = 0;
    while (state.alive && ticks < 200) {
      step(state, true);
      ticks += 1;
    }
    expect(state.alive).toBe(false);
    expect(state.y - PLAYER_HALF).toBeLessThan(0);
  });

  it("dambila carpinca oyun biter", () => {
    const state = createGame(7);
    const obstacle = state.obstacles[0];
    // Maskotu bosluk disinda (ust dambilin hizasinda) tut ve dambili maskotun ustune getir.
    state.y = obstacle.gapTop - PLAYER_HALF - 10_000;
    obstacle.x = PLAYER_X - OBSTACLE_W / 2;
    state.vy = -600; // bu adimda yer cekimiyle 0'a iner, konum degismez
    step(state, false);
    expect(state.alive).toBe(false);
  });

  it("boslugun ortasindan gecen maskot carpmaz", () => {
    const state = createGame(7);
    const obstacle = state.obstacles[0];
    state.y = obstacle.gapTop + GAP_H / 2;
    obstacle.x = PLAYER_X - OBSTACLE_W / 2;
    state.vy = -600;
    step(state, false);
    expect(state.alive).toBe(true);
  });

  it("yeniden baslatma skoru ve durumu sifirlar; ayni seed ayni engelleri uretir", () => {
    const first = createGame(99);
    playUntil(first, 3);
    expect(first.score).toBe(3);

    const restarted = createGame(99);
    expect(restarted.score).toBe(0);
    expect(restarted.tick).toBe(0);
    expect(restarted.alive).toBe(true);
    expect(restarted.obstacles).toHaveLength(1);
    expect(restarted.obstacles[0].x).toBe(WORLD_W);
    expect(restarted.obstacles[0].gapTop).toBe(createGame(99).obstacles[0].gapTop);
  });

  it("gecersiz veya oyun bittikten sonraki girdiyi reddeder", () => {
    expect(replay(1, [5, 5])).toEqual({ valid: false, reason: "invalid_input" });
    expect(replay(1, [3, 1])).toEqual({ valid: false, reason: "invalid_input" });
    expect(replay(1, [0.5])).toEqual({ valid: false, reason: "invalid_input" });
    expect(replay(1, [0, 5_000])).toEqual({ valid: false, reason: "input_after_end" });
  });
});
