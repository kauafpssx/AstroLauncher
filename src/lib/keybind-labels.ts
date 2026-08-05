export type KeybindCategory =
  | 'Movimento'
  | 'Jogabilidade'
  | 'Inventário'
  | 'Multiplayer'
  | 'Interface'
  | 'Depuração'
  | 'Mods'

export const KEYBIND_CATEGORY_ORDER: KeybindCategory[] = [
  'Movimento',
  'Jogabilidade',
  'Inventário',
  'Multiplayer',
  'Interface',
  'Depuração',
  'Mods',
]

/** Same grouping as Minecraft's own Controls screen — hardcoded in the client, so curated by hand here. */
const ACTION_CATEGORY: Record<string, KeybindCategory> = {
  forward: 'Movimento',
  left: 'Movimento',
  back: 'Movimento',
  right: 'Movimento',
  jump: 'Movimento',
  sneak: 'Movimento',
  sprint: 'Movimento',

  attack: 'Jogabilidade',
  use: 'Jogabilidade',
  pickItem: 'Jogabilidade',
  drop: 'Jogabilidade',
  swapOffhand: 'Jogabilidade',

  inventory: 'Inventário',
  'hotbar.1': 'Inventário',
  'hotbar.2': 'Inventário',
  'hotbar.3': 'Inventário',
  'hotbar.4': 'Inventário',
  'hotbar.5': 'Inventário',
  'hotbar.6': 'Inventário',
  'hotbar.7': 'Inventário',
  'hotbar.8': 'Inventário',
  'hotbar.9': 'Inventário',
  saveToolbarActivator: 'Inventário',
  loadToolbarActivator: 'Inventário',

  chat: 'Multiplayer',
  command: 'Multiplayer',
  playerlist: 'Multiplayer',
  socialInteractions: 'Multiplayer',
  advancements: 'Multiplayer',
  friends: 'Multiplayer',
  quickActions: 'Multiplayer',

  fullscreen: 'Interface',
  screenshot: 'Interface',
  togglePerspective: 'Interface',
  smoothCamera: 'Interface',
  toggleGui: 'Interface',
  spectatorOutlines: 'Interface',
  spectatorHotbar: 'Interface',
  toggleSpectatorShaderEffects: 'Interface',
}

/** Anything under `key_key.debug.*` goes to Depuração; anything from an unrecognized namespace (mods add their own `key_<modid>.*` entries) falls back to Mods. */
export function categoryForAction(action: string): KeybindCategory {
  if (ACTION_CATEGORY[action]) return ACTION_CATEGORY[action]
  if (action.startsWith('debug.')) return 'Depuração'
  return 'Mods'
}

const ACTION_LABELS: Record<string, string> = {
  attack: 'Atacar / Destruir',
  use: 'Usar Item / Colocar Bloco',
  forward: 'Andar pra Frente',
  left: 'Andar pra Esquerda',
  back: 'Andar pra Trás',
  right: 'Andar pra Direita',
  jump: 'Pular',
  sneak: 'Agachar',
  sprint: 'Correr',
  drop: 'Descartar Item Selecionado',
  inventory: 'Abrir/Fechar Inventário',
  chat: 'Abrir Chat',
  playerlist: 'Lista de Jogadores',
  pickItem: 'Selecionar Bloco',
  command: 'Abrir Comando',
  screenshot: 'Captura de Tela',
  togglePerspective: 'Alternar Perspectiva',
  smoothCamera: 'Câmera Cinemática',
  fullscreen: 'Tela Cheia',
  spectatorOutlines: 'Contorno de Jogadores (Espectador)',
  swapOffhand: 'Trocar Item com a Mão Secundária',
  saveToolbarActivator: 'Salvar Barra de Ferramentas',
  loadToolbarActivator: 'Carregar Barra de Ferramentas',
  advancements: 'Progressos',
  'hotbar.1': 'Barra de Acesso Rápido 1',
  'hotbar.2': 'Barra de Acesso Rápido 2',
  'hotbar.3': 'Barra de Acesso Rápido 3',
  'hotbar.4': 'Barra de Acesso Rápido 4',
  'hotbar.5': 'Barra de Acesso Rápido 5',
  'hotbar.6': 'Barra de Acesso Rápido 6',
  'hotbar.7': 'Barra de Acesso Rápido 7',
  'hotbar.8': 'Barra de Acesso Rápido 8',
  'hotbar.9': 'Barra de Acesso Rápido 9',
}

const KEY_LABELS: Record<string, string> = {
  'key.mouse.left': 'Mouse Esquerdo',
  'key.mouse.right': 'Mouse Direito',
  'key.mouse.middle': 'Mouse do Meio',
  'key.keyboard.space': 'Espaço',
  'key.keyboard.left.shift': 'Shift Esquerdo',
  'key.keyboard.right.shift': 'Shift Direito',
  'key.keyboard.left.control': 'Ctrl Esquerdo',
  'key.keyboard.right.control': 'Ctrl Direito',
  'key.keyboard.left.alt': 'Alt Esquerdo',
  'key.keyboard.right.alt': 'Alt Direito',
  'key.keyboard.escape': 'Esc',
  'key.keyboard.tab': 'Tab',
  'key.keyboard.caps.lock': 'Caps Lock',
  'key.keyboard.unknown': 'Não vinculado',
}

export function humanizeAction(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action
      .replace(/[._]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim()
  )
}

export function humanizeKey(value: string): string {
  if (value in KEY_LABELS) return KEY_LABELS[value]
  const keyboardMatch = value.match(/^key\.keyboard\.(.+)$/)
  if (keyboardMatch) return keyboardMatch[1].toUpperCase().replace(/\./g, ' ')
  const mouseMatch = value.match(/^key\.mouse\.(\d+)$/)
  if (mouseMatch) return `Mouse ${mouseMatch[1]}`
  return value || 'Não vinculado'
}
