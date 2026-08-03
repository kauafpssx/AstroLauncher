export type KeybindCategory = 'Movimento' | 'Jogabilidade' | 'Inventário' | 'Multiplayer' | 'Interface' | 'Depuração' | 'Mods'

export const KEYBIND_CATEGORY_ORDER: KeybindCategory[] = [
  'Movimento',
  'Jogabilidade',
  'Inventário',
  'Multiplayer',
  'Interface',
  'Depuração',
  'Mods',
]

export interface ParsedKeybind {
  /** e.g. "forward", "sodium.reload_chunks" — the part after `key_key.` */
  action: string
  label: string
  value: string
  category: KeybindCategory
}

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
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim()
}

export function humanizeKey(value: string): string {
  if (value in KEY_LABELS) return KEY_LABELS[value]
  const keyboardMatch = value.match(/^key\.keyboard\.(.+)$/)
  if (keyboardMatch) return keyboardMatch[1].toUpperCase().replace(/\./g, ' ')
  const mouseMatch = value.match(/^key\.mouse\.(\d+)$/)
  if (mouseMatch) return `Mouse ${mouseMatch[1]}`
  return value || 'Não vinculado'
}

/** Maps a browser KeyboardEvent to Minecraft's `key.keyboard.*` id. */
export function eventToMinecraftKey(event: KeyboardEvent): string | null {
  const code = event.code
  if (code === 'Escape') return null
  const map: Record<string, string> = {
    ShiftLeft: 'key.keyboard.left.shift',
    ShiftRight: 'key.keyboard.right.shift',
    ControlLeft: 'key.keyboard.left.control',
    ControlRight: 'key.keyboard.right.control',
    AltLeft: 'key.keyboard.left.alt',
    AltRight: 'key.keyboard.right.alt',
    Space: 'key.keyboard.space',
    Tab: 'key.keyboard.tab',
    CapsLock: 'key.keyboard.caps.lock',
  }
  if (map[code]) return map[code]
  if (/^Key[A-Z]$/.test(code)) return `key.keyboard.${code.slice(3).toLowerCase()}`
  if (/^Digit[0-9]$/.test(code)) return `key.keyboard.${code.slice(5)}`
  if (/^F[0-9]{1,2}$/.test(code)) return `key.keyboard.${code.toLowerCase()}`
  return `key.keyboard.${code.toLowerCase()}`
}

/** Matches any `key_*` line — vanilla (`key_key.forward`) and mod-added ones (`key_iris.keybind.reload`) alike. */
const KEY_LINE = /^key_(.+):(.*)$/
const VANILLA_PREFIX = 'key.'

function actionFromRawKey(rawKey: string): string {
  return rawKey.startsWith(VANILLA_PREFIX) ? rawKey.slice(VANILLA_PREFIX.length) : rawKey
}

export function parseKeybinds(optionsTxt: string): ParsedKeybind[] {
  const result: ParsedKeybind[] = []
  for (const rawLine of optionsTxt.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    const match = line.match(KEY_LINE)
    if (!match) continue
    const [, rawKey, value] = match
    const action = actionFromRawKey(rawKey)
    result.push({ action, label: humanizeAction(action), value, category: categoryForAction(action) })
  }
  return result
}

/** Rewrites the `key_*` lines in `optionsTxt` from `updates` (keyed by `ParsedKeybind.action`), leaving every other line untouched. */
export function applyKeybinds(optionsTxt: string, updates: Record<string, string>): string {
  return optionsTxt
    .split('\n')
    .map((rawLine) => {
      const line = rawLine.replace(/\r$/, '')
      const match = line.match(KEY_LINE)
      if (!match) return rawLine
      const [, rawKey] = match
      const action = actionFromRawKey(rawKey)
      return action in updates ? `key_${rawKey}:${updates[action]}` : rawLine
    })
    .join('\n')
}

/**
 * Maps each bound physical key (excluding `key.keyboard.unknown`) to the
 * actions currently assigned to it — any key with 2+ actions is a conflict.
 */
export function findKeybindConflicts(binds: ParsedKeybind[], overrides: Record<string, string>): Map<string, string[]> {
  const byKey = new Map<string, string[]>()
  for (const bind of binds) {
    const value = overrides[bind.action] ?? bind.value
    if (!value || value === 'key.keyboard.unknown') continue
    const actions = byKey.get(value) ?? []
    actions.push(bind.action)
    byKey.set(value, actions)
  }
  const conflicts = new Map<string, string[]>()
  for (const [key, actions] of byKey) {
    if (actions.length > 1) conflicts.set(key, actions)
  }
  return conflicts
}
