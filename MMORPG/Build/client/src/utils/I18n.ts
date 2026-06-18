const en: Record<string, string> = {
  'ui.loading': 'Loading...',
  'ui.connect': 'Connect',
  'ui.disconnect': 'Disconnected',
  'ui.reconnect': 'Reconnecting...',
  'ui.inventory': 'Inventory',
  'ui.character': 'Character',
  'ui.skills': 'Skills',
  'ui.quests': 'Quests',
  'ui.party': 'Party',
  'ui.settings': 'Settings',
  'ui.shop': 'Shop',
  'ui.trade': 'Trade',
  'ui.chat': 'Chat',
  'ui.lobby': 'Lobby',
  'ui.dashboard': 'Dashboard',

  'stat.str': 'STR',
  'stat.sta': 'STA',
  'stat.dex': 'DEX',
  'stat.int': 'INT',
  'stat.spr': 'SPR',
  'stat.atk': 'ATK',
  'stat.def': 'DEF',
  'stat.matk': 'MATK',
  'stat.mdef': 'MDEF',
  'stat.crit': 'Crit Rate',

  'item.weapon': 'Weapon',
  'item.armor': 'Armor',
  'item.potion': 'Potion',
  'item.quest': 'Quest Item',
  'item.gold': 'Gold',
  'item.ore': 'Ore',
  'item.herb': 'Herb',

  'npc.weapon': 'Weapon Merchant',
  'npc.armor': 'Armor Merchant',
  'npc.magic': 'Magic Merchant',
  'npc.storage': 'Storage Keeper',
  'npc.quest': 'Quest Guide',
  'npc.skill': 'Skill Master',
  'npc.class': 'Class Master',
  'npc.transport': 'Transport NPC',
  'npc.banker': 'Banker',
  'npc.guard': 'Guard',

  'monster.pukepuke': 'Pukepuke',
  'monster.mong': 'Mong',
  'monster.lawolf': 'Lawolf',
  'monster.giantguard': 'Giant Guard',

  'msg.welcome': 'Welcome to FlyFF!',
  'msg.levelup': 'Level Up!',
  'msg.itempickup': 'Picked up {item}',
  'msg.goldgain': 'Gained {amount} gold',
  'msg.death': 'You have died',
  'msg.respawn': 'Respawning...',
  'msg.notenoughgold': 'Not enough gold',
  'msg.inventoryfull': 'Inventory is full',

  'ui.level': 'Lv.{level}',
  'ui.hp': 'HP',
  'ui.mp': 'MP',
  'ui.xp': 'XP',
  'ui.gold': 'Gold: {amount}',
  'ui.damage': '{damage}',
  'ui.heal': '+{amount}',
  'ui.flight': 'Flight',
  'ui.stamina': 'Stamina',

  'error.connection': 'Connection lost. Reconnecting...',
  'error.auth': 'Authentication failed',
  'error.invalid': 'Invalid input',
};

const dictionaries: Record<string, Record<string, string>> = { en };

let currentLanguage = 'en';

export function setLanguage(lang: string): void {
  if (dictionaries[lang]) currentLanguage = lang;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLanguage];
  let text = dict[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function addLanguage(lang: string, dict: Record<string, string>): void {
  dictionaries[lang] = dict;
}
