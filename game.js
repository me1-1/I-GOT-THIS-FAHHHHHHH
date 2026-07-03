const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const ui = {
  mode: document.getElementById("mode"),
  floor: document.getElementById("floor"),
  hp: document.getElementById("hp"),
  shield: document.getElementById("shield"),
  weapon: document.getElementById("weapon"),
  ammo: document.getElementById("ammo"),
  vehicle: document.getElementById("vehicle"),
  armor: document.getElementById("armor"),
  allies: document.getElementById("allies"),
  coins: document.getElementById("coins"),
  skillPoints: document.getElementById("skillPoints"),
  boss: document.getElementById("boss"),
  hpBar: document.getElementById("hpBar"),
  reloadBar: document.getElementById("reloadBar"),
  log: document.getElementById("log"),
  allyBreakdown: document.getElementById("allyBreakdown"),
  desktopMode: document.getElementById("desktopMode"),
  mobileMode: document.getElementById("mobileMode"),
  mobileControls: document.getElementById("mobileControls"),
  joystick: document.getElementById("joystick"),
  joystickKnob: document.getElementById("joystickKnob"),
  mobileAttack: document.getElementById("mobileAttack"),
  mobileInteract: document.getElementById("mobileInteract"),
  vehicleMenu: document.getElementById("vehicleMenu"),
  closeVehicleMenu: document.getElementById("closeVehicleMenu"),
  depotVehicleButtons: Array.from(document.querySelectorAll("[data-depot-vehicle]")),
  skillLabels: {
    speed: document.getElementById("skill-speed"),
    firerate: document.getElementById("skill-firerate"),
    damage: document.getElementById("skill-damage"),
    health: document.getElementById("skill-health"),
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
  { name: "Burst SMG", type: "ranged", damage: 9, cooldown: 55, range: 340, mag: 32, ammo: 128, reload: 1250, speed: 12, minFloor: 2, price: 24 },
  { name: "Police Revolver", type: "ranged", damage: 26, cooldown: 360, range: 360, mag: 6, ammo: 48, reload: 980, speed: 11, minFloor: 2, price: 18 },
  { name: "Tactical Carbine", type: "ranged", damage: 18, cooldown: 130, range: 460, mag: 20, ammo: 100, reload: 1200, speed: 13, minFloor: 3, price: 34 },
  { name: "Pump Shotgun", type: "ranged", damage: 18, cooldown: 720, range: 260, mag: 5, ammo: 30, reload: 1350, speed: 9, pellets: 6, spread: 0.28, minFloor: 2, price: 20 },
  { name: "AR-15 Assault Rifle", type: "ranged", damage: 15, cooldown: 95, range: 500, mag: 24, ammo: 96, reload: 1500, speed: 13, minFloor: 3, price: 30 },
  { name: "Minigun", type: "ranged", damage: 8, cooldown: 35, range: 520, mag: 80, ammo: 240, reload: 2600, speed: 14, spread: 0.12, minFloor: 5, price: 72 },
  { name: "Autocannon", type: "ranged", damage: 38, cooldown: 240, range: 620, mag: 12, ammo: 72, reload: 2200, speed: 12, splash: 34, minFloor: 6, price: 86 },
  { name: "Grenade Launcher", type: "ranged", damage: 46, cooldown: 860, range: 380, mag: 4, ammo: 16, reload: 1650, speed: 6, splash: 88, minFloor: 4, price: 36 },
  { name: "Laser Carbine", type: "ranged", damage: 28, cooldown: 180, range: 560, mag: 18, ammo: 90, reload: 1100, speed: 15, minFloor: 5, price: 48 },
  { name: "Rocket Launcher", type: "ranged", damage: 72, cooldown: 980, range: 460, mag: 1, ammo: 8, reload: 1700, speed: 7, splash: 76, minFloor: 5, price: 42 },
  { name: "Moonsteel Blade", type: "melee", damage: 36, cooldown: 250, range: 52, minFloor: 4, price: 34 },
  { name: "Plasma Cannon", type: "ranged", damage: 64, cooldown: 520, range: 520, mag: 6, ammo: 36, reload: 1900, speed: 9, splash: 54, minFloor: 7, price: 64 },
];

const skillNames = ["speed", "firerate", "damage", "health"];
const BASE_COINS = 10000;
const VEHICLE_DEPOT_COST = 35;
const saveKey = "lastTorchDungeonSave10000Coins";
const weaponByName = Object.fromEntries(weapons.map((weapon) => [weapon.name, weapon]));

const vehicles = [
  { name: "On Foot", price: 0, speed: 0, armor: 0, color: "#ffffff", tier: "Base" },
  { name: "Scrap Bike", price: 18, speed: 0.65, armor: 8, color: "#aa5500", tier: "Common" },
  { name: "Dungeon Kart", price: 32, speed: 0.4, armor: 24, color: "#5555ff", tier: "Common" },
  { name: "War Buggy", price: 55, speed: 0.85, armor: 38, color: "#aaaaaa", tier: "Uncommon" },
  { name: "Light Tank", price: 95, speed: -0.05, armor: 160, color: "#55ff55", tier: "Rare" },
  { name: "Battle Tank", price: 155, speed: -0.25, armor: 280, color: "#ffff55", tier: "Legendary" },
  { name: "Humvee Turret", price: 0, speed: 0.45, armor: 70, color: "#00aa00", tier: "Common" },
  { name: "APC Carrier", price: 0, speed: 0.25, armor: 120, color: "#555555", tier: "Rare" },
  { name: "Siege Tank", price: 0, speed: -0.15, armor: 220, color: "#55ff55", tier: "Legendary" },
  { name: "A-10 Close Air Support", price: 0, speed: 1.15, armor: 85, color: "#55ffff", tier: "Mythic" },
];
const vehicleByName = Object.fromEntries(vehicles.map((vehicle) => [vehicle.name, vehicle]));

const shopStock = [
  { label: "Bladesmith", x: 220, y: 220, weapon: "Rusty Sword" },
  { label: "Bowyer", x: 355, y: 220, weapon: "Hunter Bow" },
  { label: "Gunsmith", x: 500, y: 220, weapon: "Flintlock Pistol" },
  { label: "SMG Rack", x: 645, y: 220, weapon: "Burst SMG" },
  { label: "Revolver", x: 930, y: 220, weapon: "Police Revolver" },
  { label: "Carbine", x: 1080, y: 220, weapon: "Tactical Carbine" },
  { label: "Shotgunner", x: 790, y: 220, weapon: "Pump Shotgun" },
  { label: "Armory", x: 575, y: 420, weapon: "AR-15 Assault Rifle" },
  { label: "Minigun", x: 435, y: 420, weapon: "Minigun" },
  { label: "Autocannon", x: 295, y: 420, weapon: "Autocannon" },
  { label: "Grenadier", x: 715, y: 420, weapon: "Grenade Launcher" },
  { label: "Demolition", x: 850, y: 420, weapon: "Rocket Launcher" },
  { label: "Laser Lab", x: 990, y: 420, weapon: "Laser Carbine" },
  { label: "Plasma Bay", x: 1135, y: 420, weapon: "Plasma Cannon" },
];

const vehicleStock = [
  { label: "Bike Shop", x: 195, y: 515, vehicle: "Scrap Bike" },
  { label: "Kart Bay", x: 345, y: 515, vehicle: "Dungeon Kart" },
  { label: "Buggy Dock", x: 500, y: 515, vehicle: "War Buggy" },
  { label: "Light Tank", x: 950, y: 515, vehicle: "Light Tank" },
  { label: "Battle Tank", x: 1120, y: 515, vehicle: "Battle Tank" },
];

const allyTypes = {
  peasant: { name: "Peasant Ally", price: 5, hp: 32, speed: 1.65, damage: 9, range: 220, cooldown: 620, color: "#ffff55", weapon: "Knife/Bow" },
  firefighter: { name: "Firefighter Survivor", price: 10, hp: 58, speed: 1.75, damage: 14, range: 250, cooldown: 520, color: "#ff5555", weapon: "Axe/Pistol" },
  police: { name: "Police Officer", price: 14, hp: 52, speed: 1.85, damage: 17, range: 330, cooldown: 430, color: "#5555ff", weapon: "Pistol" },
  survivor: { name: "Armed Survivor", price: 12, hp: 46, speed: 1.8, damage: 18, range: 300, cooldown: 780, color: "#55ffff", weapon: "Flintlock" },
  soldier: { name: "Soldier", price: 24, hp: 70, speed: 1.9, damage: 15, range: 380, cooldown: 210, color: "#55ff55", weapon: "AR/Shotgun/RPG" },
};

const vehicleAllyTypes = {
  humvee: { name: "Humvee Turret", hp: 95, speed: 1.65, damage: 12, range: 360, cooldown: 130, color: "#00aa00", r: 18, tier: "Common" },
  apc: { name: "APC Carrier", hp: 150, speed: 1.18, damage: 26, range: 400, cooldown: 260, color: "#555555", r: 22, tier: "Rare" },
  tank: { name: "Siege Tank", hp: 260, speed: 0.78, damage: 74, range: 430, cooldown: 1050, splash: 82, color: "#55ff55", r: 26, tier: "Legendary" },
  a10: { name: "A-10 Close Air Support", hp: 120, speed: 2.45, damage: 10, range: 560, cooldown: 45, splash: 0, bombDamage: 110, bombSplash: 120, bombCooldown: 30000, flying: true, color: "#55ffff", r: 20, tier: "Mythic" },
};

const allyRosterRows = [
  ["peasant", "Peasants"],
  ["police", "Police"],
  ["firefighter", "Firefighters"],
  ["survivor", "Survivors"],
  ["soldier", "Soldiers"],
  ["humvee", "Humvees"],
  ["apc", "APCs"],
  ["tank", "Tanks"],
  ["a10", "A-10s"],
];

const recruitSites = [
  { label: "Run-down Shack", x: 205, y: 95, recruit: "peasant" },
  { label: "Old Police Station", x: 405, y: 95, recruit: "police" },
  { label: "Fire Station", x: 1040, y: 95, recruit: "firefighter" },
  { label: "Barracks", x: 620, y: 95, recruit: "soldier" },
  { label: "Vehicle Depot", x: 830, y: 95, depot: true },
];

function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) || "{}");
    return {
      coins: Number.isFinite(saved.coins) ? saved.coins : BASE_COINS,
      ownedWeapons: Array.isArray(saved.ownedWeapons) ? saved.ownedWeapons : ["Pocket Knife"],
      ownedVehicles: Array.isArray(saved.ownedVehicles) ? saved.ownedVehicles : ["On Foot"],
    };
  } catch {
    return { coins: BASE_COINS, ownedWeapons: ["Pocket Knife"], ownedVehicles: ["On Foot"] };
  }
}

const saveData = loadSave();

const state = {
  mode: "town",
  floor: 0,
  keys: new Set(),
  mouse: { x: VIEW_W / 2, y: VIEW_H / 2, down: false },
  mobile: { enabled: false, joyX: 0, joyY: 0, activePointer: null },
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
    ownedVehicles: new Set(["On Foot", ...saveData.ownedVehicles]),
    vehicle: vehicles[0],
    armor: 0,
    allies: [],
    skillPoints: 0,
    skills: { speed: 0, firerate: 0, damage: 0, health: 0 },
    weapon: { ...weapons[0], clip: 0, reserve: 0, reloading: 0 },
    attackCd: 0,
    invuln: 0,
    facing: 0,
  },
};

const colors = {
  wall: "#000000",
  floor: "#0000aa",
  townGrass: "#00aa00",
  townPath: "#aa5500",
  player: "#ffffff",
  monster: "#ff5555",
  chest: "#ffff55",
  potion: "#ff55ff",
  exit: "#55ff55",
  npc: "#55ffff",
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
  return Math.round(state.player.weapon.damage * (1 + state.player.skills.damage * 0.12));
}

function rangedDamage(base) {
  return Math.round(base * (1 + state.player.skills.damage * 0.12));
}

function spendSkill(name) {
  const p = state.player;
  if (!skillNames.includes(name) || p.skillPoints <= 0) return;
  p.skillPoints -= 1;
  p.skills[name] += 1;
  if (name === "health") {
    p.maxHp += 14;
    p.hp += 14;
  }
  log(`${name.toUpperCase()} upgraded.`);
}

function saveProgress() {
  try {
    localStorage.setItem(saveKey, JSON.stringify({
      coins: state.player.coins,
      ownedWeapons: Array.from(state.player.ownedWeapons),
      ownedVehicles: Array.from(state.player.ownedVehicles),
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

function buyOrEquipVehicle(vehicleName) {
  const p = state.player;
  const vehicle = vehicleByName[vehicleName];
  if (!vehicle) return;
  if (p.ownedVehicles.has(vehicle.name)) {
    p.vehicle = vehicle;
    p.armor = Math.max(p.armor, vehicle.armor);
    log(`${vehicle.name} is ready for this run.`);
    return;
  }
  if (p.coins < vehicle.price) {
    log(`${vehicle.name} costs ${vehicle.price} coins. You have ${p.coins}.`);
    return;
  }
  p.coins -= vehicle.price;
  p.ownedVehicles.add(vehicle.name);
  p.vehicle = vehicle;
  p.armor = Math.max(p.armor, vehicle.armor);
  saveProgress();
  log(`Unlocked ${vehicle.name} for ${vehicle.price} coins.`);
}

function openVehicleDepotMenu() {
  ui.vehicleMenu.classList.add("open");
  ui.vehicleMenu.setAttribute("aria-hidden", "false");
}

function closeVehicleDepotMenu() {
  ui.vehicleMenu.classList.remove("open");
  ui.vehicleMenu.setAttribute("aria-hidden", "true");
}

function selectDepotVehicle(type) {
  const p = state.player;
  const vehicle = vehicleAllyTypes[type];
  if (!vehicle) return;
  if (p.coins < VEHICLE_DEPOT_COST) {
    log(`${vehicle.name} costs ${VEHICLE_DEPOT_COST} coins. You have ${p.coins}.`);
    return;
  }
  p.coins -= VEHICLE_DEPOT_COST;
  saveProgress();
  spawnVehicleAlly(type);
  closeVehicleDepotMenu();
  log(`Vehicle Depot: ${vehicle.name} joined your squad for ${VEHICLE_DEPOT_COST} coins.`);
}

function spawnVehicleAlly(type) {
  const spec = vehicleAllyTypes[type];
  const p = state.player;
  if (!spec) return;
  const spot = allyFormationPoint(p.allies.length, spec.r);
  p.allies.push({
    ...spec,
    type,
    vehicleAlly: true,
    x: spot.x,
    y: spot.y,
    r: spec.r,
    maxHp: spec.hp,
    hp: spec.hp,
    attackCd: 0,
    bombCd: spec.bombCooldown || 0,
    facing: 0,
  });
}

function addAlly(type, sourceText = "joined the run") {
  const spec = allyTypes[type];
  const p = state.player;
  if (!spec) return;
  const spot = allyFormationPoint(p.allies.length, 11);
  p.allies.push({
    ...spec,
    type,
    x: spot.x,
    y: spot.y,
    r: 11,
    maxHp: spec.hp,
    hp: spec.hp,
    attackCd: 0,
    facing: 0,
  });
  log(`${spec.name} ${sourceText}.`);
}

function recruitAlly(type) {
  const spec = allyTypes[type];
  const p = state.player;
  if (!spec) return;
  if (p.coins < spec.price) {
    log(`${spec.name} costs ${spec.price} coins.`);
    return;
  }
  p.coins -= spec.price;
  saveProgress();
  addAlly(type, "joined the run");
}

function buyArmor() {
  const p = state.player;
  const price = 8 + Math.floor(p.armor / 12);
  if (p.coins < price) {
    log(`Armor plating costs ${price} coins.`);
    return;
  }
  p.coins -= price;
  p.armor += 18;
  saveProgress();
  log(`Bought armor plating. Armor is now ${p.armor}.`);
}

function buyAmmo() {
  const p = state.player;
  if (p.weapon.type !== "ranged") {
    log("Equip a ranged weapon before buying ammo.");
    return;
  }
  const price = Math.max(4, Math.ceil(p.weapon.mag / 3));
  if (p.coins < price) {
    log(`Ammo costs ${price} coins.`);
    return;
  }
  p.coins -= price;
  p.weapon.reserve += Math.max(p.weapon.mag * 2, 12);
  saveProgress();
  log(`Bought ammo for ${p.weapon.name}.`);
}

function resetRunBuild() {
  const p = state.player;
  p.maxHp = 100;
  p.hp = p.maxHp;
  p.maxShield = 42;
  p.shield = 18;
  p.armor = 0;
  p.allies = [];
  p.skillPoints = 0;
  p.skills = { speed: 0, firerate: 0, damage: 0, health: 0 };
  p.vehicle = vehicles[0];
  p.attackCd = 0;
  p.invuln = 0;
  p.weapon = cloneWeapon(weapons[0]);
}

function resetForTown() {
  const p = state.player;
  resetRunBuild();
  p.attackCd = 0;
  p.invuln = 0;
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

function safeSpotNear(x, y, r = 10, seed = 0) {
  if (!isBlocked(x, y, r)) return { x, y };
  for (let ring = 1; ring <= 5; ring++) {
    const radius = ring * 18;
    for (let step = 0; step < 12; step++) {
      const angle = seed + (step / 12) * Math.PI * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (!isBlocked(px, py, r)) return { x: px, y: py };
    }
  }
  return { x: state.player.x, y: state.player.y };
}

function allyFormationPoint(index, r = 11) {
  const p = state.player;
  const angle = index * 2.05 + Math.PI * 0.75;
  const radius = 42 + (index % 4) * 10;
  return safeSpotNear(p.x + Math.cos(angle) * radius, p.y + Math.sin(angle) * radius, r, angle);
}

function placeAlliesNearPlayer() {
  state.player.allies.forEach((ally, index) => {
    const spot = allyFormationPoint(index, ally.r);
    ally.x = spot.x;
    ally.y = spot.y;
    ally.facing = state.player.facing;
    ally.attackCd = Math.min(ally.attackCd, 250);
  });
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
    ...recruitSites.map((site) => ({ kind: "npc", x: site.x, y: site.y, r: 18, text: site.label, recruit: site.recruit, depot: site.depot })),
    ...shopStock.map((shop) => ({ kind: "npc", x: shop.x, y: shop.y, r: 15, text: shop.label, shopWeapon: shop.weapon })),
    ...vehicleStock.map((shop) => ({ kind: "npc", x: shop.x, y: shop.y, r: 15, text: shop.label, shopVehicle: shop.vehicle })),
    { kind: "npc", x: 645, y: 515, r: 15, text: "Armor", armorShop: true },
    { kind: "npc", x: 775, y: 515, r: 15, text: "Ammo", ammoShop: true },
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
  placeAlliesNearPlayer();

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

  const eventRoom = rooms[Math.min(rooms.length - 1, Math.max(1, Math.floor(rooms.length / 2)))];
  if (state.floor % 10 === 0) {
    const types = ["peasant", "police", "firefighter", "survivor", "soldier"];
    state.entities.push({
      kind: "rescue",
      x: eventRoom.cx * TILE + TILE / 2 + 34,
      y: eventRoom.cy * TILE + TILE / 2,
      r: 16,
      rescueType: types[irand(0, types.length - 1)],
    });
  }
  if (state.floor % 15 === 0) {
    state.entities.push(
      { kind: "npc", x: eventRoom.cx * TILE + TILE / 2 - 40, y: eventRoom.cy * TILE + TILE / 2 + 34, r: 15, text: "Deep Ammo", ammoShop: true },
      { kind: "npc", x: eventRoom.cx * TILE + TILE / 2 + 40, y: eventRoom.cy * TILE + TILE / 2 + 34, r: 15, text: "Deep Armor", armorShop: true },
      { kind: "npc", x: eventRoom.cx * TILE + TILE / 2, y: eventRoom.cy * TILE + TILE / 2 + 70, r: 15, text: "Deep Arms", shopWeapon: weapons[irand(2, weapons.length - 1)].name }
    );
    log("A traveling shop waits somewhere on this floor.");
  }

  log(state.bossAlive ? `Floor ${state.floor}: a boss guards the stairs.` : `Floor ${state.floor}: the stairs vanish behind you.`);
}

function spawnMonster(x, y) {
  const level = state.floor;
  const types = level === 1 ? [
    { name: "Dungeon Rat", hp: 16, damage: 4, speed: 0.78, color: "#aa5500" },
    { name: "Small Slime", hp: 22, damage: 5, speed: 0.62, color: "#55ff55" },
  ] : [
    { name: "Cave Imp", hp: 30 + level * 4, damage: 7 + level, speed: 1.05, color: "#ff5555" },
    { name: "Bone Knight", hp: 58 + level * 7, damage: 11 + level, speed: 0.72, color: "#aaaaaa" },
    { name: "Torch Eater", hp: 42 + level * 5, damage: 9 + level, speed: 1.35, color: "#aa00aa" },
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
    { name: "The Iron Butcher", color: "#aa0000" },
    { name: "Grave Engine", color: "#5555ff" },
    { name: "Cinder Tyrant", color: "#ffff55" },
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
  state.player.skillPoints += 1;
  const roll = Math.random();
  if (roll < 0.45) {
    const ammo = irand(18, 55);
    if (state.player.weapon.type === "ranged") state.player.weapon.reserve += ammo;
    log(`Found ${ammo} rounds.`);
  } else if (roll < 0.72) {
    state.player.coins += irand(2, 5);
    saveProgress();
    log("Found coin scraps and a skill point.");
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

function getInteractable() {
  const p = state.player;
  let best = null;
  let bestDist = Infinity;
  for (const e of state.entities) {
    if (!["npc", "chest", "weaponChest", "potion", "exit", "rescue"].includes(e.kind)) continue;
    const d = dist(p, e);
    if (d <= p.r + e.r + 18 && d < bestDist) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}

function interactLabel(e) {
  if (!e) return "...";
  if (e.kind === "chest") return "OPEN";
  if (e.kind === "weaponChest") return e.locked ? "LOCKED" : "WEAPON";
  if (e.kind === "potion") return "POTION";
  if (e.kind === "rescue") return "RESCUE";
  if (e.kind === "exit") return "ENTER";
  if (e.shopWeapon || e.shopVehicle) return "BUY";
  if (e.recruit) return "HIRE";
  if (e.depot) return "SELECT";
  if (e.armorShop) return "ARMOR";
  if (e.ammoShop) return "AMMO";
  if (e.heal) return "HEAL";
  return "TALK";
}

function interact() {
  const p = state.player;
  const e = getInteractable();
  if (!e) return;
  if (e.kind === "npc") {
    if (e.shopWeapon) {
      buyOrEquipWeapon(e.shopWeapon);
    } else if (e.shopVehicle) {
      buyOrEquipVehicle(e.shopVehicle);
    } else if (e.recruit) {
      recruitAlly(e.recruit);
    } else if (e.depot) {
      openVehicleDepotMenu();
    } else if (e.armorShop) {
      buyArmor();
    } else if (e.ammoShop) {
      buyAmmo();
    } else if (e.heal) {
      p.hp = Math.min(p.maxHp, p.hp + e.heal);
      log("The healer patches you up.");
    } else if (e.skill) {
      log("The trainer says: spend skill points as you earn them below.");
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
  if (e.kind === "rescue") {
    addAlly(e.rescueType, "was rescued");
    e.dead = true;
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

function meleeAttack() {
  const p = state.player;
  if (p.attackCd > 0) return;
  const rate = Math.max(0.35, 1 - p.skills.firerate * 0.055);
  const attack = p.weapon.type === "melee"
    ? { damage: meleeDamage(), range: p.weapon.range, cooldown: p.weapon.cooldown * rate }
    : { damage: 10, range: 38, cooldown: 360 * rate };
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
  burst(p.x + Math.cos(p.facing) * 24, p.y + Math.sin(p.facing) * 24, hit ? "#ffff55" : "#aaaaaa", 8);
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
  p.attackCd = w.cooldown * Math.max(0.35, 1 - p.skills.firerate * 0.055);
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
    burst(p.x + Math.cos(angle) * 20, p.y + Math.sin(angle) * 20, w.splash ? "#ff5555" : "#ffff55", 3);
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
  burst(monster.x, monster.y, "#ffff55", 6);
  if (monster.hp <= 0) {
    monster.dead = true;
    state.player.coins += monster.boss ? 8 : 1;
    saveProgress();
    state.player.skillPoints += monster.boss ? 5 : 1;
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

function nearestMonster(source, range = Infinity) {
  let best = null;
  let bestDist = range;
  for (const e of state.entities) {
    if (e.kind !== "monster" || e.dead) continue;
    const d = dist(source, e);
    if (d < bestDist) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}

function updateAllies(dt) {
  const p = state.player;
  p.allies.forEach((ally, index) => {
    ally.attackCd = Math.max(0, ally.attackCd - dt);
    ally.bombCd = Math.max(0, (ally.bombCd || 0) - dt);
    const home = allyFormationPoint(index, ally.r);
    if (dist(ally, p) > 180 || (!ally.flying && isBlocked(ally.x, ally.y, ally.r))) {
      ally.x = home.x;
      ally.y = home.y;
    }
    const d = dist(ally, home);
    if (d > 12) {
      const angle = Math.atan2(home.y - ally.y, home.x - ally.x);
      if (ally.flying) {
        ally.x += Math.cos(angle) * ally.speed;
        ally.y += Math.sin(angle) * ally.speed;
      } else {
        moveBody(ally, Math.cos(angle) * ally.speed, Math.sin(angle) * ally.speed);
      }
    }
    if (dist(ally, p) > 120) {
      const spot = allyFormationPoint(index, ally.r);
      ally.x = spot.x;
      ally.y = spot.y;
    }
    const target = nearestMonster(ally, ally.range);
    if (!target) return;
    ally.facing = Math.atan2(target.y - ally.y, target.x - ally.x);
    const targetDist = dist(ally, target);
    if (ally.type === "a10" && ally.bombCd <= 0 && targetDist < ally.range) {
      for (const e of state.entities) {
        if (e.kind === "monster" && dist(e, target) < ally.bombSplash) damageMonster(e, ally.bombDamage);
      }
      burst(target.x, target.y, "#ff5555", 34);
      ally.bombCd = ally.bombCooldown;
      log("A-10 dropped bombs.");
    }
    if (ally.attackCd > 0) return;
    ally.attackCd = ally.cooldown;
    if (ally.type === "peasant" && targetDist < 48 + target.r) {
      damageMonster(target, ally.damage);
      burst(target.x, target.y, "#ffff55", 5);
      return;
    }
    if (targetDist < ally.range) {
      const explosive = (ally.type === "soldier" && Math.random() < 0.18) || ally.type === "tank";
      state.bullets.push({
        x: ally.x + Math.cos(ally.facing) * 14,
        y: ally.y + Math.sin(ally.facing) * 14,
        vx: Math.cos(ally.facing) * (ally.type === "tank" ? 6 : 10),
        vy: Math.sin(ally.facing) * (ally.type === "tank" ? 6 : 10),
        life: ally.range,
        damage: explosive && !ally.vehicleAlly ? 42 : ally.damage,
        splash: ally.splash || (explosive ? 58 : 0),
      });
      burst(ally.x, ally.y, explosive ? "#ff5555" : "#55ffff", 3);
    }
  });
}

function hurtPlayer(amount) {
  const p = state.player;
  if (p.invuln > 0) return;
  const blocking = state.keys.has("Shift");
  let incoming = blocking ? Math.ceil(amount * 0.35) : amount;
  if (blocking) {
    p.shield = Math.min(p.maxShield, p.shield + 1);
    burst(p.x, p.y, "#55ffff", 5);
  }
  const armorBlocked = Math.min(p.armor, Math.ceil(incoming * 0.65));
  p.armor -= armorBlocked;
  incoming -= armorBlocked;
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
  const speed = state.keys.has("Shift") ? 1.45 : 2.35 + p.skills.speed * 0.13 + p.vehicle.speed;
  let dx = 0;
  let dy = 0;
  if (state.keys.has("w") || state.keys.has("ArrowUp")) dy -= 1;
  if (state.keys.has("s") || state.keys.has("ArrowDown")) dy += 1;
  if (state.keys.has("a") || state.keys.has("ArrowLeft")) dx -= 1;
  if (state.keys.has("d") || state.keys.has("ArrowRight")) dx += 1;
  if (state.mobile.enabled) {
    dx += state.mobile.joyX;
    dy += state.mobile.joyY;
  }
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    moveBody(p, (dx / len) * speed, (dy / len) * speed);
    if (state.mobile.enabled && Math.abs(state.mobile.joyX) + Math.abs(state.mobile.joyY) > 0.15) {
      p.facing = Math.atan2(state.mobile.joyY, state.mobile.joyX);
    }
  }

  const aimX = state.mouse.x + state.camera.x;
  const aimY = state.mouse.y + state.camera.y;
  if (!state.mobile.enabled || Math.abs(state.mobile.joyX) + Math.abs(state.mobile.joyY) <= 0.15) {
    p.facing = Math.atan2(aimY - p.y, aimX - p.x);
  }
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);

  if (state.mouse.down) shoot();
  updateAllies(dt);
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
          burst(b.x, b.y, "#ff5555", 22);
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
  drawAllies();
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
      ctx.strokeStyle = tile === 1 ? "#555555" : "#00aa00";
      ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

function drawEntities() {
  for (const e of state.entities) {
    if (e.kind === "monster") {
      rectSprite(e.x, e.y, e.boss ? 44 : 24, e.boss ? 44 : 24, e.color);
      if (e.boss) drawText("BOSS", e.x - 16, e.y - 34, "#ffff55");
      healthPip(e);
    } else if (e.kind === "chest") {
      rectSprite(e.x, e.y, 24, 18, e.opened ? "#555555" : colors.chest);
      drawText("?", e.x - 4, e.y + 5, "#000000");
    } else if (e.kind === "weaponChest") {
      rectSprite(e.x, e.y, 28, 20, e.locked ? "#555555" : "#55ffff");
      drawText(e.locked ? "L" : "W", e.x - 4, e.y + 5, "#000000");
    } else if (e.kind === "potion") {
      rectSprite(e.x, e.y, 16, 20, colors.potion);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(e.x - 3, e.y - 5, 6, 8);
    } else if (e.kind === "rescue") {
      rectSprite(e.x, e.y, 24, 26, "#ff55ff");
      drawText("HELP", e.x - 14, e.y - 22, "#ffffff");
    } else if (e.kind === "exit") {
      ctx.fillStyle = colors.exit;
      ctx.fillRect(e.x - 20, e.y - 20, 40, 40);
      ctx.fillStyle = "#0000aa";
      ctx.fillRect(e.x - 11, e.y - 11, 22, 22);
    } else if (e.kind === "npc") {
      rectSprite(e.x, e.y, e.recruit || e.depot ? 44 : 24, e.recruit || e.depot ? 30 : 28, colors.npc);
      drawText(e.text, e.x - 30, e.y - 24, "#ffffff");
      if (e.shopWeapon) {
        const weapon = weaponByName[e.shopWeapon];
        const owned = state.player.ownedWeapons.has(e.shopWeapon);
        drawText(owned ? "OWNED" : `${weapon.price} coins`, e.x - 31, e.y + 31, owned ? "#55ff55" : "#ffff55");
      } else if (e.shopVehicle) {
        const vehicle = vehicleByName[e.shopVehicle];
        const owned = state.player.ownedVehicles.has(e.shopVehicle);
        drawText(owned ? "OWNED" : `${vehicle.price} coins`, e.x - 31, e.y + 31, owned ? "#55ff55" : "#ffff55");
      } else if (e.recruit) {
        const spec = allyTypes[e.recruit];
        drawText(`${spec.price} coins`, e.x - 25, e.y + 31, "#ffff55");
      } else if (e.depot) {
        drawText(`${VEHICLE_DEPOT_COST} coins`, e.x - 27, e.y + 31, "#ff55ff");
      } else if (e.armorShop) {
        drawText("armor", e.x - 19, e.y + 31, "#aaaaaa");
      } else if (e.ammoShop) {
        drawText("ammo", e.x - 17, e.y + 31, "#55ffff");
      }
    }
  }
}

function drawAllies() {
  for (const ally of state.player.allies) {
    if (ally.vehicleAlly) {
      const size = ally.type === "tank" ? 46 : ally.type === "apc" ? 42 : ally.type === "a10" ? 48 : 34;
      rectSprite(ally.x, ally.y, size, ally.type === "a10" ? 22 : 28, ally.color);
      ctx.fillStyle = "#000000";
      if (ally.type === "a10") {
        ctx.fillRect(ally.x - 30, ally.y - 3, 60, 6);
      } else {
        ctx.fillRect(ally.x + Math.cos(ally.facing) * 8 - 4, ally.y + Math.sin(ally.facing) * 8 - 4, 22, 8);
      }
    } else {
      rectSprite(ally.x, ally.y, 20, 22, ally.color);
    }
    ctx.fillStyle = "#000000";
    ctx.fillRect(ally.x + Math.cos(ally.facing) * 8 - 2, ally.y + Math.sin(ally.facing) * 8 - 2, 4, 4);
    const width = ally.vehicleAlly ? 34 : 20;
    ctx.fillStyle = "#000000";
    ctx.fillRect(ally.x - width / 2, ally.y - 18, width, 3);
    ctx.fillStyle = "#55ff55";
    ctx.fillRect(ally.x - width / 2, ally.y - 18, width * Math.max(0, ally.hp / ally.maxHp), 3);
  }
}

function drawBullets() {
  ctx.fillStyle = "#ffff55";
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
  if (p.vehicle.name !== "On Foot") {
    const heavy = p.vehicle.name.includes("Tank") || p.vehicle.name.includes("APC") || p.vehicle.name.includes("Humvee");
    rectSprite(p.x, p.y, heavy ? 46 : 34, heavy ? 32 : 26, p.vehicle.color);
    if (p.vehicle.name.includes("A-10")) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(p.x - 28, p.y - 4, 56, 8);
    } else if (heavy) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(p.x + Math.cos(p.facing) * 10 - 4, p.y + Math.sin(p.facing) * 10 - 4, 22, 8);
    }
    rectSprite(p.x, p.y - 4, 18, 20, colors.player);
  } else {
    rectSprite(p.x, p.y, 24, 28, colors.player);
  }
  ctx.fillStyle = "#000000";
  ctx.fillRect(p.x + Math.cos(p.facing) * 10 - 3, p.y + Math.sin(p.facing) * 10 - 3, 6, 6);
  if (state.keys.has("Shift")) {
    ctx.strokeStyle = "#55ffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, p.facing - 0.85, p.facing + 0.85);
    ctx.stroke();
  }
}

function drawOverlay() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, VIEW_W, 28);
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px Courier New";
  const hint = state.mode === "town"
    ? "Town: recruit allies, roll depot armor, buy gear, then enter the dungeon."
    : state.bossAlive ? "Boss floor: defeat the boss to unlock chests and stairs." : "Dungeon: survive, loot weapon chests, find green stairs, repeat forever.";
  ctx.fillText(hint, 14, 20);
  if (state.gameOver) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#ffff55";
    ctx.font = "42px Courier New";
    ctx.fillText("YOU WERE LOST BELOW", 230, 292);
    ctx.font = "20px Courier New";
    ctx.fillText("Press R to restart in town", 344, 332);
  }
}

function rectSprite(x, y, w, h, color) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(Math.round(x - w / 2) + 3, Math.round(y - h / 2) + 3, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
  ctx.fillStyle = color === "#ffffff" ? "#aaaaaa" : "#ffffff";
  ctx.fillRect(Math.round(x - w / 2) + 3, Math.round(y - h / 2) + 3, w - 6, 4);
}

function healthPip(e) {
  const width = e.boss ? 52 : 28;
  ctx.fillStyle = "#000000";
  ctx.fillRect(e.x - width / 2, e.y - 24, width, 4);
  ctx.fillStyle = "#55ff55";
  ctx.fillRect(e.x - width / 2, e.y - 24, width * Math.max(0, e.hp / e.maxHp), 4);
}

function drawText(text, x, y, color) {
  ctx.font = "12px Courier New";
  ctx.fillStyle = "#000000";
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function updateUI() {
  const p = state.player;
  const w = p.weapon;
  const nearby = getInteractable();
  const allyCounts = Object.fromEntries(allyRosterRows.map(([key]) => [key, 0]));
  for (const ally of p.allies) {
    if (allyCounts[ally.type] === undefined) allyCounts[ally.type] = 0;
    allyCounts[ally.type] += 1;
  }
  ui.mode.textContent = state.mode === "town" ? "Town" : "Dungeon";
  ui.floor.textContent = state.floor;
  ui.hp.textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  ui.shield.textContent = `${p.shield}/${p.maxShield}`;
  ui.weapon.textContent = w.name;
  ui.ammo.textContent = w.type === "ranged" ? `${w.clip}/${w.reserve}` : "-";
  ui.vehicle.textContent = p.vehicle.name;
  ui.armor.textContent = p.armor;
  ui.allies.textContent = p.allies.length;
  ui.coins.textContent = p.coins;
  ui.skillPoints.textContent = p.skillPoints;
  ui.boss.textContent = state.bossAlive ? "Alive" : "-";
  for (const name of skillNames) ui.skillLabels[name].textContent = `${p.skills[name]}`;
  for (const button of ui.skillButtons) {
    button.disabled = p.skillPoints <= 0;
  }
  ui.allyBreakdown.innerHTML = allyRosterRows
    .map(([key, label]) => `<span>${label}</span><span>${allyCounts[key] || 0}</span>`)
    .join("");
  ui.hpBar.style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  ui.reloadBar.style.width = w.type === "ranged" && w.reload ? `${w.reloading > 0 ? 100 - (w.reloading / w.reload) * 100 : 100}%` : "100%";
  if (state.mobile.enabled && nearby) {
    ui.mobileInteract.textContent = interactLabel(nearby);
    ui.mobileInteract.classList.add("visible");
    ui.mobileInteract.disabled = nearby.kind === "weaponChest" && nearby.locked && state.bossAlive;
  } else {
    ui.mobileInteract.classList.remove("visible");
    ui.mobileInteract.disabled = false;
  }
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
    resetRunBuild();
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

for (const button of ui.depotVehicleButtons) {
  button.addEventListener("click", () => selectDepotVehicle(button.dataset.depotVehicle));
}

ui.closeVehicleMenu.addEventListener("click", closeVehicleDepotMenu);

ui.vehicleMenu.addEventListener("click", (event) => {
  if (event.target === ui.vehicleMenu) closeVehicleDepotMenu();
});

function setMobileMode(enabled) {
  state.mobile.enabled = enabled;
  document.body.classList.toggle("mobile-mode", enabled);
  ui.mobileMode.classList.toggle("active", enabled);
  ui.desktopMode.classList.toggle("active", !enabled);
  if (!enabled) resetJoystick();
}

function resetJoystick() {
  state.mobile.joyX = 0;
  state.mobile.joyY = 0;
  state.mobile.activePointer = null;
  ui.joystickKnob.style.left = "42px";
  ui.joystickKnob.style.top = "42px";
}

function updateJoystick(event) {
  const rect = ui.joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const max = rect.width / 2 - 24;
  let dx = event.clientX - cx;
  let dy = event.clientY - cy;
  const len = Math.hypot(dx, dy);
  if (len > max) {
    dx = (dx / len) * max;
    dy = (dy / len) * max;
  }
  state.mobile.joyX = dx / max;
  state.mobile.joyY = dy / max;
  ui.joystickKnob.style.left = `${42 + dx}px`;
  ui.joystickKnob.style.top = `${42 + dy}px`;
}

ui.desktopMode.addEventListener("click", () => setMobileMode(false));
ui.mobileMode.addEventListener("click", () => setMobileMode(true));

ui.joystick.addEventListener("pointerdown", (event) => {
  if (!state.mobile.enabled) return;
  event.preventDefault();
  state.mobile.activePointer = event.pointerId;
  ui.joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});

ui.joystick.addEventListener("pointermove", (event) => {
  if (event.pointerId !== state.mobile.activePointer) return;
  event.preventDefault();
  updateJoystick(event);
});

ui.joystick.addEventListener("pointerup", (event) => {
  if (event.pointerId === state.mobile.activePointer) resetJoystick();
});

ui.joystick.addEventListener("pointercancel", (event) => {
  if (event.pointerId === state.mobile.activePointer) resetJoystick();
});

ui.mobileAttack.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  shoot();
});

ui.mobileInteract.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  interact();
});

makeTown();
requestAnimationFrame(loop);
