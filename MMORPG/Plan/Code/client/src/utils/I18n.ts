const en: Record<string, string> = {
  'ui.loading': 'Loading...',
  'ui.login': 'Login',
  'ui.register': 'Register',
  'ui.username': 'Username',
  'ui.password': 'Password',
  'ui.email': 'Email',
  'ui.start': 'Start Game',
  'ui.settings': 'Settings',
  'ui.quit': 'Quit',
  'ui.inventory': 'Inventory',
  'ui.character': 'Character',
  'ui.skills': 'Skills',
  'ui.quests': 'Quests',
  'ui.party': 'Party',
  'ui.guild': 'Guild',
  'ui.friends': 'Friends',
  'ui.dashboard': 'Dashboard',
  'ui.shop': 'Shop',
  'ui.trade': 'Trade',
  'ui.chat': 'Chat',
  'ui.minimap': 'Minimap',
  'ui.leaderboard': 'Leaderboard',
  'ui.achievements': 'Achievements',
  'chat.general': 'General',
  'chat.party': 'Party',
  'chat.guild': 'Guild',
  'chat.whisper': 'Whisper',
  'chat.world': 'World',
  'chat.shout': 'Shout',
  'stat.str': 'STR',
  'stat.sta': 'STA',
  'stat.dex': 'DEX',
  'stat.int': 'INT',
  'stat.spr': 'SPR',
  'msg.killed': '{killer} eliminated {victim}',
  'msg.levelup': 'Congratulations! You reached level {level}!',
  'msg.item_pickup': 'Picked up {item}',
  'msg.gold_pickup': 'Picked up {amount} Penya',
  'msg.party_invite': '{name} invited you to a party',
  'msg.trade_request': '{name} wants to trade with you',
  'msg.guild_invite': '{name} invited you to join {guild}',
  'error.connection_lost': 'Connection lost. Reconnecting...',
  'error.server_full': 'Server is full. Try again later.',
  'error.invalid_name': 'Invalid character name',
};

const languages: Record<string, Record<string, string>> = { en };

let currentLanguage = 'en';

export function setLanguage(lang: string): void {
  if (languages[lang]) {
    currentLanguage = lang;
  }
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = languages[currentLanguage] || languages.en;
  let text = dict[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
