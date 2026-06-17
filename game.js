const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  mode: document.getElementById("mode"),
  floor: document.getElementById("floor"),
  hp: document.getElementById("hp"),
  shield: document.getElementById("shield"),
  weapon: document.getElementById("weapon"),
  ammo: document.getElementById("ammo"),
  coins: document.getElementById("coins"),
  skillPoints: document.getElementById("skillPoints"),
  boss: document.getElementById("boss"),
  hpBar: document.getElementById("hpBar"),
  reloadBar: document.getElementById("reloadBar"),
  log: document.getElementById("log"),
  skillLabels: {
    vigor: document.getElementById("skill-vigor"),
    blade: document.getElementById("skill-blade"),
    guns: document.getElementById("skill-guns"),
    guard: document.getElementById("skill-guard"),
  },
  skillButtons: Array.from(document.querySelectorAll("[data-skill]")),
};

const TILE = 32;
const MAP_W = 48;
const MAP_H = 36;
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

const weapons = [
  { name: "Pocket Knife", type: "melee", damage: 12, cooldown: 300, range: 34, minFloor: 1, price: 0 },
  { name: "Rusty Sword", type: "melee", damage: 18, cooldown: 320, range: 42, minFloor: 1, price: 6 },
  { name: "Hunter Bow", type: "ranged", damage: 22, cooldown: 420, range: 420, mag: 1, ammo: 24, reload: 760, speed: 8, minFloor: 1, price: 9 },
  { name: "Flintlock Pistol", type: "ranged", damage: 44, cooldown: 620, range: 360, mag: 1, ammo: 16, reload: 1200, speed: 10, minFloor: 2, price: 14 },
  { name: "Pump Shotgun", type: "ranged", damage: 18, cooldown: 720, range: 260, mag: 5, ammo: 30, reload: 1350, speed: 9, pellets: 6, spread: 0.28, minFloor: 2, price: 20 },
  { name: "AR-15 Assault Rifle", type: "ranged", damage: 15, cooldown: 95, range: 500, mag: 24, ammo: 96, reload: 1500, speed: 13, minFloor: 3, price: 30 },
  { name: "Rocket Launcher", type: "ranged", damage: 72, cooldown: 980, range: 460, mag: 1, ammo: 8, reload: 1700, speed: 7, splash: 76, minFloor: 5, price: 42 },
  { name: "Moonsteel Blade", type: "melee", damage: 36, cooldown: 250, range: 52, minFloor: 4, price: 34 },
];

const skillNames = ["vigor", "blade", "guns", "guard"];
const saveKey = "lastTorchDungeonSave";
const weaponByName = Object.fromEntries(weapons.map((weapon) => [weapon.name, weapon]));

const shopStock = [
  { label: "Bladesmith", x: 220, y: 220, weapon: "Rusty Sword" },
  { label: "Bowyer", x: 355, y: 220, weapon: "Hunter Bow" },
  { label: "Gunsmith", x: 500, y: 220, weapon: "Flintlock Pistol" },
  { label: "Shotgunner", x: 650, y: 220, weapon: "Pump Shotgun" },
  { label: "Armory", x: 635, y: 420, weapon: "AR-15 Assault Rifle" },
  { label: "Demolition", x: 780, y: 420, weapon: "Rocket Launcher" },
];

function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) || "{}");
    return {
      coins: Number.isFinite(saved.coins) ? saved.coins : 0,
      ownedWeapons: Array.isArray(saved.ownedWeapons) ? saved.ownedWeapons : ["Pocket Knife"],
    };
  } catch {
    return { coins: 0, ownedWeapons: ["Pocket Knife"] };
  }
}

const saveData = loadSave();

const state = {
  mode: "town",
  floor: 0,
  keys: new Set(),
  mouse: { x: VIEW_W / 2, y: VIEW_H / 2, down: false },
  camera: { x: 0, y: 0 },
  map: [],
  entities: [],
  bullets: [],
  particles: [],
  messages: [],
  lastTime: performance.now(),
  gameOver: false,
  bossAlive: false,
  player: {
    x: 360,
    y: 320,
    r: 13,
    hp: 100,
    maxHp: 100,
    shield: 18,
    maxShield: 42,
    coins: saveData.coins,
    ownedWeapons: new Set(["Pocket Knife", ...saveData.ownedWeapons]),
    skillPoints: 0,
    skills: { vigor: 0, blade: 0, guns: 0, guard: 0 },
    weapon: { ...weapons[0], clip: 0, reserve: 0, reloading: 0 },
    attackCd: 0,
    invuln: 0,
    facing: 0,
  },
};

const colors = {
  wall: "#262615",
  floor: "#15170f",
  townGrass: "#19331c",
  townPath: "#51482a",
  player: "#63e6ff",
  monster: "#ff5a4f",
  chest: "#d99b35",
  potion: "#e84870",
  exit: "#8be06a",
  npc: "#ffd35a",
};

function log(text) {
  state.messages.unshift(text);
  state.messages = state.messages.slice(0, 7);
  ui.log.innerHTML = state.messages.map((msg) => `<p>${msg}</p>`).join("");
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function irand(min, max) {
  return Math.floor(rand(min, max + 1));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function cloneWeapon(weapon) {
  const copy = { ...weapon, reloading: 0 };
  copy.clip = weapon.mag || 0;
  copy.reserve = weapon.ammo || 0;
  return copy;
}

function meleeDamage() {
  return Math.round(state.player.weapon.damage * (1 + state.player.skills.blade * 0.18));
}

function rangedDamage(base) {
  return Math.round(base * (1 + state.player.skills.guns * 0.14));
}

function spendSkill(name) {
  const p = state.player;
  if (!skillNames.includes(name) || p.skills[name] >= 3 || p.skillPoints <= 0) return;
  p.skillPoints -= 1;
  p.skills[name] += 1;
  if (name === "vigor") {
    p.maxHp += 18;
    p.hp += 18;
  }
  if (name === "guard") {
    p.maxShield += 10;
    p.shield = Math.min(p.maxShield, p.shield + 10);
  }
  log(`${name.toUpperCase()} upgraded.`);
}

function saveProgress() {
  try {
    localStorage.setItem(saveKey, JSON.stringify({
      coins: state.player.coins,
      ownedWeapons: Array.from(state.player.ownedWeapons),
    }));
  } catch {
    // Progress still works for the current play session if storage is unavailable.
  }
}

function setWeapon(weapon) {
  state.player.weapon = cloneWeapon(weapon);
  log(`Equipped ${weapon.name}.`);
}

function buyOrEquipWeapon(weaponName) {
  const p = state.player;
  const weapon = weaponByName[weaponName];
  if (!weapon) return;
  if (p.ownedWeapons.has(weapon.name)) {
    setWeapon(weapon);
    log(`${weapon.name} is ready for this run.`);
    return;
  }
  if (p.coins < weapon.price) {
    log(`${weapon.name} costs ${weapon.price} coins. You have ${p.coins}.`);
    return;
  }
  p.coins -= weapon.price;
  p.ownedWeapons.add(weapon.name);
  saveProgress();
  setWeapon(weapon);
  log(`Bought ${weapon.name} for ${weapon.price} coins.`);
}

function resetForTown() {
  const p = state.player;
  p.hp = p.maxHp;
  p.shield = Math.min(p.maxShield, Math.max(18, p.shield));
  p.attackCd = 0;
  p.invuln = 0;
  p.weapon = cloneWeapon(weapons[0]);
}

function makeEmptyMap(fill = 1) {
  return Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => fill));
}

function setTile(x, y, value) {
  if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) state.map[y][x] = value;
}

function tileAtWorld(x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return 1;
  return state.map[ty][tx];
}

function isBlocked(x, y, r = 10) {
  const points = [
    [x - r, y - r],
    [x + r, y - r],
    [x - r, y + r],
    [x + r, y + r],
  ];
  return points.some(([px, py]) => tileAtWorld(px, py) === 1);
}

function moveBody(body, dx, dy) {
  if (!isBlocked(body.x + dx, body.y, body.r)) body.x += dx;
  if (!isBlocked(body.x, body.y + dy, body.r)) body.y += dy;
}

function carveRoom(x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setTile(xx, yy, 0);
  }
}

function carveLine(x1, y1, x2, y2) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) setTile(x, y1, 0);
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) setTile(x2, y, 0);
}

function makeTown() {
  state.mode = "town";
  state.floor = 0;
  state.entities = [];
  state.bullets = [];
  state.bossAlive = false;
  state.map = makeEmptyMap(0);
  resetForTown();
  state.player.x = 360;
  state.player.y = 320;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      state.map[y][x] = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1 ? 1 : 0;
    }
  }
  for (let x = 4; x < 36; x++) setTile(x, 10, 2);
  for (let y = 8; y < 26; y++) setTile(20, y, 2);
  state.entities.push(
    ...shopStock.map((shop) => ({ kind: "npc", x: shop.x, y: shop.y, r: 15, text: shop.label, shopWeapon: shop.weapon })),
    { kind: "npc", x: 250, y: 420, r: 15, text: "Healer", heal: 20 },
    { kind: "npc", x: 410, y: 420, r: 15, text: "Trainer", skill: true },
    { kind: "potion", x: 455, y: 398, r: 12, heal: 25 },
    { kind: "exit", x: 900, y: 320, r: 24 }
  );
  log("Spend dungeon coins in town, then enter with your chosen gear.");
}

function makeDungeon() {
  state.mode = "dungeon";
  state.floor += 1;
  state.entities = [];
  state.bullets = [];
  state.bossAlive = state.floor % 5 === 0;
  state.map = makeEmptyMap(1);

  const rooms = [];
  for (let i = 0; i < 12 + Math.min(state.floor, 10); i++) {
    const w = irand(5, 10);
    const h = irand(4, 8);
    const x = irand(2, MAP_W - w - 3);
    const y = irand(2, MAP_H - h - 3);
    const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };
    carveRoom(x, y, w, h);
    if (rooms.length) carveLine(rooms[rooms.length - 1].cx, rooms[rooms.length - 1].cy, room.cx, room.cy);
    rooms.push(room);
  }

  const start = rooms[0];
  state.player.x = start.cx * TILE + TILE / 2;
  state.player.y = start.cy * TILE + TILE / 2;

  rooms.slice(1).forEach((room, index) => {
    const cx = room.cx * TILE + TILE / 2;
    const cy = room.cy * TILE + TILE / 2;
    if (index === rooms.length - 2) {
      state.entities.push({ kind: "exit", x: cx, y: cy, r: 24 });
      return;
    }
    if (state.bossAlive && index === rooms.length - 3) {
      spawnBoss(cx, cy);
      state.entities.push({ kind: "weaponChest", x: cx + 48, y: cy + 20, r: 14, opened: false, locked: true });
      return;
    }
    if (Math.random() < (state.floor === 1 ? 0.55 : 0.82)) spawnMonster(cx + rand(-45, 45), cy + rand(-35, 35));
    if (Math.random() < 0.18) state.entities.push({ kind: "chest", x: cx + rand(-40, 40), y: cy + rand(-30, 30), r: 13, opened: false });
    if (Math.random() < 0.16) state.entities.push({ kind: "weaponChest", x: cx + rand(-40, 40), y: cy + rand(-30, 30), r: 14, opened: false, locked: state.floor < 2 && Math.random() < 0.5 });
    if (Math.random() < 0.22) state.entities.push({ kind: "potion", x: cx + rand(-40, 40), y: cy + rand(-30, 30), r: 11, heal: irand(18, 34) });
  });

  log(state.bossAlive ? `Floor ${state.floor}: a boss guards the stairs.` : `Floor ${state.floor}: the stairs vanish behind you.`);
}

function spawnMonster(x, y) {
  const level = state.floor;
  const types = level === 1 ? [
    { name: "Dungeon Rat", hp: 16, damage: 4, speed: 0.78, color: "#a8895d" },
    { name: "Small Slime", hp: 22, damage: 5, speed: 0.62, color: "#76c96b" },
  ] : [
    { name: "Cave Imp", hp: 30 + level * 4, damage: 7 + level, speed: 1.05, color: "#ff5a4f" },
    { name: "Bone Knight", hp: 58 + level * 7, damage: 11 + level, speed: 0.72, color: "#d7d7c2" },
    { name: "Torch Eater", hp: 42 + level * 5, damage: 9 + level, speed: 1.35, color: "#b66cff" },
  ];
  const t = types[irand(0, Math.min(types.length - 1, Math.floor(level / 2) + 1))];
  state.entities.push({
    kind: "monster",
    name: t.name,
    x,
    y,
    r: 14,
    hp: t.hp,
    maxHp: t.hp,
    damage: t.damage,
    speed: t.speed,
    color: t.color,
    hitCd: 0,
    boss: false,
  });
}

function spawnBoss(x, y) {
  const level = state.floor;
  const bosses = [
    { name: "The Iron Butcher", color: "#f04747" },
    { name: "Grave Engine", color: "#a8a8ff" },
    { name: "Cinder Tyrant", color: "#ff9d42" },
  ];
  const t = bosses[Math.floor(level / 5) % bosses.length];
  state.entities.push({
    kind: "monster",
    name: t.name,
    x,
    y,
    r: 24,
    hp: 220 + level * 32,
    maxHp: 220 + level * 32,
    damage: 18 + level * 2,
    speed: 0.58 + Math.min(0.35, level * 0.015),
    color: t.color,
    hitCd: 0,
    boss: true,
  });
}

function openChest(chest) {
  if (chest.opened) return;
  if (chest.locked && state.bossAlive) {
    log("The boss aura keeps this weapon chest locked.");
    return;
  }
  chest.opened = true;
  if (chest.kind === "weaponChest") {
    const eligible = weapons.filter((weapon) => weapon.minFloor <= state.floor && weapon.name !== state.player.weapon.name);
    const loot = eligible[irand(0, eligible.length - 1)] || weapons[1];
    setWeapon(loot);
    state.player.skillPoints += 1;
    log("The weapon chest hums. Skill point gained.");
    return;
  }
  const roll = Math.random();
  if (roll < 0.45) {
    const ammo = irand(18, 55);
    if (state.player.weapon.type === "ranged") state.player.weapon.reserve += ammo;
    log(`Found ${ammo} rounds.`);
  } else if (roll < 0.72) {
    state.player.skillPoints += 1;
    log("Found an old combat manual. Skill point gained.");
  } else {
    state.player.shield = Math.min(state.player.maxShield, state.player.shield + irand(10, 22));
    log("Found a shield charm.");
  }
}

function usePotion(potion) {
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + potion.heal);
  potion.dead = true;
  log(`Potion restored ${potion.heal} HP.`);
}

function interact() {
  const p = state.player;
  for (const e of state.entities) {
    if (dist(p, e) > p.r + e.r + 18) continue;
    if (e.kind === "npc") {
      if (e.shopWeapon) {
        buyOrEquipWeapon(e.shopWeapon);
      } else if (e.heal) {
        p.hp = Math.min(p.maxHp, p.hp + e.heal);
        log("The healer patches you up.");
      } else if (e.skill) {
        if (e.used) {
          log("The trainer has taught you all he can.");
        } else {
          e.used = true;
          p.skillPoints += 1;
          log("The trainer gives you one lesson before the descent.");
        }
      } else {
        log("The town is quiet before the next run.");
      }
      return;
    }
    if (e.kind === "chest" || e.kind === "weaponChest") {
      openChest(e);
      return;
    }
    if (e.kind === "potion") {
      usePotion(e);
      return;
    }
    if (e.kind === "exit") {
      if (state.bossAlive) {
        log("The stairs are sealed until the boss falls.");
        return;
      }
      makeDungeon();
      return;
    }
  }
}

function meleeAttack() {
  const p = state.player;
  if (p.attackCd > 0) return;
  const attack = p.weapon.type === "melee"
    ? { damage: meleeDamage(), range: p.weapon.range, cooldown: p.weapon.cooldown }
    : { damage: 10, range: 38, cooldown: 360 };
  p.attackCd = attack.cooldown;
  let hit = false;
  for (const e of state.entities) {
    if (e.kind !== "monster") continue;
    const angle = Math.atan2(e.y - p.y, e.x - p.x);
    const delta = Math.abs(Math.atan2(Math.sin(angle - p.facing), Math.cos(angle - p.facing)));
    if (dist(p, e) < attack.range + e.r && delta < 1.35) {
      damageMonster(e, attack.damage);
      hit = true;
    }
  }
  burst(p.x + Math.cos(p.facing) * 24, p.y + Math.sin(p.facing) * 24, hit ? "#ffe57a" : "#8a8560", 8);
}

function shoot() {
  const p = state.player;
  const w = p.weapon;
  if (w.type !== "ranged") {
    meleeAttack();
    return;
  }
  if (p.attackCd > 0 || w.reloading > 0) return;
  if (w.clip <= 0) {
    startReload();
    return;
  }
  w.clip -= 1;
  p.attackCd = w.cooldown;
  const shots = w.pellets || 1;
  for (let i = 0; i < shots; i++) {
    const spread = w.spread || 0.045;
    const angle = p.facing + rand(-spread, spread);
    state.bullets.push({
      x: p.x + Math.cos(angle) * 18,
      y: p.y + Math.sin(angle) * 18,
      vx: Math.cos(angle) * w.speed,
      vy: Math.sin(angle) * w.speed,
      life: w.range,
      damage: rangedDamage(w.damage),
      splash: w.splash || 0,
    });
    burst(p.x + Math.cos(angle) * 20, p.y + Math.sin(angle) * 20, w.splash ? "#ff8d42" : "#ffd35a", 3);
  }
  if (w.clip <= 0) startReload();
}

function startReload() {
  const w = state.player.weapon;
  if (w.type !== "ranged" || w.reserve <= 0 || w.clip >= w.mag || w.reloading > 0) return;
  w.reloading = w.reload;
  log("Reloading...");
}

function finishReload() {
  const w = state.player.weapon;
  const need = w.mag - w.clip;
  const loaded = Math.min(need, w.reserve);
  w.clip += loaded;
  w.reserve -= loaded;
}

function damageMonster(monster, amount) {
  monster.hp -= amount;
  burst(monster.x, monster.y, "#ffdf6d", 6);
  if (monster.hp <= 0) {
    monster.dead = true;
    state.player.coins += monster.boss ? 8 : 1;
    saveProgress();
    state.player.skillPoints += monster.boss ? 3 : (Math.random() < 0.22 ? 1 : 0);
    if (monster.boss) {
      state.bossAlive = false;
      for (const e of state.entities) if (e.kind === "weaponChest") e.locked = false;
      log(`${monster.name} defeated. The stairs unlock.`);
    } else {
      log(`${monster.name} defeated.`);
    }
    if (Math.random() < 0.2) state.entities.push({ kind: "potion", x: monster.x, y: monster.y, r: 11, heal: irand(12, 24) });
  }
}

function hurtPlayer(amount) {
  const p = state.player;
  if (p.invuln > 0) return;
  const blocking = state.keys.has("Shift");
  let incoming = blocking ? Math.ceil(amount * (0.35 - p.skills.guard * 0.06)) : amount;
  if (blocking) {
    p.shield = Math.min(p.maxShield, p.shield + 1);
    burst(p.x, p.y, "#6cc4ff", 5);
  }
  const absorbed = Math.min(p.shield, Math.floor(incoming * 0.45));
  p.shield -= absorbed;
  incoming -= absorbed;
  p.hp -= incoming;
  p.invuln = 520;
  if (p.hp <= 0) {
    p.hp = 0;
    saveProgress();
    makeTown();
    log("You fell below, but your coins made it back to town.");
  }
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    state.particles.push({ x, y, vx: rand(-2, 2), vy: rand(-2, 2), life: rand(240, 520), color });
  }
}

function update(dt) {
  if (state.gameOver) return;
  const p = state.player;
  const speed = state.keys.has("Shift") ? 1.45 : 2.35 + state.player.skills.vigor * 0.1;
  let dx = 0;
  let dy = 0;
  if (state.keys.has("w") || state.keys.has("ArrowUp")) dy -= 1;
  if (state.keys.has("s") || state.keys.has("ArrowDown")) dy += 1;
  if (state.keys.has("a") || state.keys.has("ArrowLeft")) dx -= 1;
  if (state.keys.has("d") || state.keys.has("ArrowRight")) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    moveBody(p, (dx / len) * speed, (dy / len) * speed);
  }

  const aimX = state.mouse.x + state.camera.x;
  const aimY = state.mouse.y + state.camera.y;
  p.facing = Math.atan2(aimY - p.y, aimX - p.x);
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);

  if (state.mouse.down) shoot();
  if (p.weapon.reloading > 0) {
    p.weapon.reloading -= dt;
    if (p.weapon.reloading <= 0) {
      p.weapon.reloading = 0;
      finishReload();
    }
  }

  for (const b of state.bullets) {
    b.x += b.vx;
    b.y += b.vy;
    b.life -= Math.hypot(b.vx, b.vy);
    if (tileAtWorld(b.x, b.y) === 1 || b.life <= 0) b.dead = true;
    for (const e of state.entities) {
      if (e.kind === "monster" && !b.dead && dist(b, e) < e.r + 4) {
        damageMonster(e, b.damage);
        if (b.splash) {
          for (const target of state.entities) {
            if (target.kind === "monster" && target !== e && dist(b, target) < b.splash) damageMonster(target, Math.round(b.damage * 0.65));
          }
          burst(b.x, b.y, "#ff8d42", 22);
        }
        b.dead = true;
      }
    }
  }

  for (const e of state.entities) {
    if (e.kind === "monster") updateMonster(e, dt);
    if (e.kind === "potion" && dist(p, e) < p.r + e.r) usePotion(e);
  }

  for (const part of state.particles) {
    part.x += part.vx;
    part.y += part.vy;
    part.life -= dt;
  }

  state.entities = state.entities.filter((e) => !e.dead);
  state.bullets = state.bullets.filter((b) => !b.dead);
  state.particles = state.particles.filter((part) => part.life > 0);
  state.camera.x = Math.max(0, Math.min(MAP_W * TILE - VIEW_W, p.x - VIEW_W / 2));
  state.camera.y = Math.max(0, Math.min(MAP_H * TILE - VIEW_H, p.y - VIEW_H / 2));
}

function updateMonster(monster, dt) {
  const p = state.player;
  monster.hitCd = Math.max(0, monster.hitCd - dt);
  const d = dist(monster, p);
  if (d < 420) {
    const angle = Math.atan2(p.y - monster.y, p.x - monster.x);
    moveBody(monster, Math.cos(angle) * monster.speed, Math.sin(angle) * monster.speed);
  }
  if (d < monster.r + p.r + 6 && monster.hitCd <= 0) {
    hurtPlayer(monster.damage);
    monster.hitCd = 850;
  }
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);
  drawMap();
  drawEntities();
  drawBullets();
  drawParticles();
  drawPlayer();
  ctx.restore();
  drawOverlay();
  updateUI();
}

function drawMap() {
  const startX = Math.floor(state.camera.x / TILE);
  const startY = Math.floor(state.camera.y / TILE);
  const endX = startX + Math.ceil(VIEW_W / TILE) + 1;
  const endY = startY + Math.ceil(VIEW_H / TILE) + 1;
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = state.map[y]?.[x] ?? 1;
      ctx.fillStyle = tile === 1 ? colors.wall : state.mode === "town" && tile === 0 ? colors.townGrass : tile === 2 ? colors.townPath : colors.floor;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.strokeStyle = tile === 1 ? "#34321f" : "rgba(255,255,255,0.035)";
      ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

function drawEntities() {
  for (const e of state.entities) {
    if (e.kind === "monster") {
      rectSprite(e.x, e.y, e.boss ? 44 : 24, e.boss ? 44 : 24, e.color);
      if (e.boss) drawText("BOSS", e.x - 16, e.y - 34, "#ffd35a");
      healthPip(e);
    } else if (e.kind === "chest") {
      rectSprite(e.x, e.y, 24, 18, e.opened ? "#6b5430" : colors.chest);
      drawText("?", e.x - 4, e.y + 5, "#1b1307");
    } else if (e.kind === "weaponChest") {
      rectSprite(e.x, e.y, 28, 20, e.locked ? "#59606b" : "#6cc4ff");
      drawText(e.locked ? "L" : "W", e.x - 4, e.y + 5, "#071018");
    } else if (e.kind === "potion") {
      rectSprite(e.x, e.y, 16, 20, colors.potion);
      ctx.fillStyle = "#ffd5df";
      ctx.fillRect(e.x - 3, e.y - 5, 6, 8);
    } else if (e.kind === "exit") {
      ctx.fillStyle = colors.exit;
      ctx.fillRect(e.x - 20, e.y - 20, 40, 40);
      ctx.fillStyle = "#111";
      ctx.fillRect(e.x - 11, e.y - 11, 22, 22);
    } else if (e.kind === "npc") {
      rectSprite(e.x, e.y, 24, 28, colors.npc);
      drawText(e.text, e.x - 30, e.y - 24, "#fff0a6");
      if (e.shopWeapon) {
        const weapon = weaponByName[e.shopWeapon];
        const owned = state.player.ownedWeapons.has(e.shopWeapon);
        drawText(owned ? "OWNED" : `${weapon.price} coins`, e.x - 31, e.y + 31, owned ? "#79e66d" : "#ffd35a");
      }
    }
  }
}

function drawBullets() {
  ctx.fillStyle = "#ffe57a";
  for (const b of state.bullets) ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / 520);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const p = state.player;
  if (p.invuln > 0 && Math.floor(p.invuln / 80) % 2 === 0) return;
  rectSprite(p.x, p.y, 24, 28, colors.player);
  ctx.fillStyle = "#081014";
  ctx.fillRect(p.x + Math.cos(p.facing) * 10 - 3, p.y + Math.sin(p.facing) * 10 - 3, 6, 6);
  if (state.keys.has("Shift")) {
    ctx.strokeStyle = "#6cc4ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, p.facing - 0.85, p.facing + 0.85);
    ctx.stroke();
  }
}

function drawOverlay() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(0, 0, VIEW_W, 28);
  ctx.fillStyle = "#f5f0d8";
  ctx.font = "16px Courier New";
  const hint = state.mode === "town"
    ? "Town: press E at shops to buy or equip weapons with coins kept after death."
    : state.bossAlive ? "Boss floor: defeat the boss to unlock chests and stairs." : "Dungeon: survive, loot weapon chests, find green stairs, repeat forever.";
  ctx.fillText(hint, 14, 20);
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#ffd35a";
    ctx.font = "42px Courier New";
    ctx.fillText("YOU WERE LOST BELOW", 230, 292);
    ctx.font = "20px Courier New";
    ctx.fillText("Press R to restart in town", 344, 332);
  }
}

function rectSprite(x, y, w, h, color) {
  ctx.fillStyle = "#070806";
  ctx.fillRect(Math.round(x - w / 2) + 3, Math.round(y - h / 2) + 3, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(Math.round(x - w / 2) + 3, Math.round(y - h / 2) + 3, w - 6, 4);
}

function healthPip(e) {
  const width = e.boss ? 52 : 28;
  ctx.fillStyle = "#0b0c0a";
  ctx.fillRect(e.x - width / 2, e.y - 24, width, 4);
  ctx.fillStyle = "#ff5a4f";
  ctx.fillRect(e.x - width / 2, e.y - 24, width * Math.max(0, e.hp / e.maxHp), 4);
}

function drawText(text, x, y, color) {
  ctx.font = "12px Courier New";
  ctx.fillStyle = "#080908";
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function updateUI() {
  const p = state.player;
  const w = p.weapon;
  ui.mode.textContent = state.mode === "town" ? "Town" : "Dungeon";
  ui.floor.textContent = state.floor;
  ui.hp.textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  ui.shield.textContent = `${p.shield}/${p.maxShield}`;
  ui.weapon.textContent = w.name;
  ui.ammo.textContent = w.type === "ranged" ? `${w.clip}/${w.reserve}` : "-";
  ui.coins.textContent = p.coins;
  ui.skillPoints.textContent = p.skillPoints;
  ui.boss.textContent = state.bossAlive ? "Alive" : "-";
  for (const name of skillNames) ui.skillLabels[name].textContent = `${p.skills[name]}/3`;
  for (const button of ui.skillButtons) {
    const name = button.dataset.skill;
    button.disabled = p.skillPoints <= 0 || p.skills[name] >= 3;
  }
  ui.hpBar.style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  ui.reloadBar.style.width = w.type === "ranged" && w.reload ? `${w.reloading > 0 ? 100 - (w.reloading / w.reload) * 100 : 100}%` : "100%";
}

function loop(now) {
  const dt = Math.min(40, now - state.lastTime);
  state.lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
  if (event.key === " ") shoot();
  if (event.key.toLowerCase() === "f") meleeAttack();
  if (event.key.toLowerCase() === "e") interact();
  if (["1", "2", "3", "4"].includes(event.key)) spendSkill(skillNames[Number(event.key) - 1]);
  if (event.key.toLowerCase() === "r" && state.gameOver) {
    state.gameOver = false;
    state.player.maxHp = 100;
    state.player.hp = state.player.maxHp;
    state.player.maxShield = 42;
    state.player.shield = 18;
    state.player.skillPoints = 0;
    state.player.skills = { vigor: 0, blade: 0, guns: 0, guard: 0 };
    state.player.weapon = cloneWeapon(weapons[0]);
    makeTown();
  }
  state.keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = ((event.clientX - rect.left) / rect.width) * VIEW_W;
  state.mouse.y = ((event.clientY - rect.top) / rect.height) * VIEW_H;
});

canvas.addEventListener("mousedown", () => {
  state.mouse.down = true;
  shoot();
});

window.addEventListener("mouseup", () => {
  state.mouse.down = false;
});

for (const button of ui.skillButtons) {
  button.addEventListener("click", () => spendSkill(button.dataset.skill));
}

makeTown();
requestAnimationFrame(loop);
