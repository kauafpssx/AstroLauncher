export type OptionValueType = 'boolean' | 'integer' | 'float' | 'string'

export type OptionCategory = 'Vídeo' | 'Áudio' | 'Controles' | 'Chat' | 'Acessibilidade' | 'Aparência' | 'Geral'

export const OPTION_CATEGORY_ORDER: OptionCategory[] = [
  'Vídeo',
  'Áudio',
  'Controles',
  'Chat',
  'Acessibilidade',
  'Aparência',
  'Geral',
]

export interface ParsedOption {
  key: string
  label: string
  editableValue: string
  rawValue: string
  type: OptionValueType
  category: OptionCategory
}

const LINE = /^([^:]+):(.*)$/
/** Keys that are internal bookkeeping, not something a user should edit. */
const SKIP_KEYS = new Set(['version'])

/** Grouping mirrors Minecraft's own options screens as closely as reasonable — there's no metadata file for this, it's hardcoded in the game's client, so it's curated here by hand. */
const CATEGORY_BY_KEY: Record<string, OptionCategory> = {
  ao: 'Vídeo',
  biomeBlendRadius: 'Vídeo',
  chunkSectionFadeInTime: 'Vídeo',
  cutoutLeaves: 'Vídeo',
  enableVsync: 'Vídeo',
  entityDistanceScaling: 'Vídeo',
  entityShadows: 'Vídeo',
  forceUnicodeFont: 'Vídeo',
  japaneseGlyphVariants: 'Vídeo',
  fov: 'Vídeo',
  fovEffectScale: 'Vídeo',
  glintSpeed: 'Vídeo',
  glintStrength: 'Vídeo',
  preferredGraphicsBackend: 'Vídeo',
  graphicsPreset: 'Vídeo',
  prioritizeChunkUpdates: 'Vídeo',
  fullscreen: 'Vídeo',
  exclusiveFullscreen: 'Vídeo',
  gamma: 'Vídeo',
  guiScale: 'Vídeo',
  maxAnisotropyBit: 'Vídeo',
  textureFiltering: 'Vídeo',
  maxFps: 'Vídeo',
  improvedTransparency: 'Vídeo',
  inactivityFpsLimit: 'Vídeo',
  mipmapLevels: 'Vídeo',
  particles: 'Vídeo',
  reducedDebugInfo: 'Vídeo',
  renderClouds: 'Vídeo',
  cloudRange: 'Vídeo',
  renderDistance: 'Vídeo',
  simulationDistance: 'Vídeo',
  screenEffectScale: 'Vídeo',
  vignette: 'Vídeo',
  weatherRadius: 'Vídeo',
  darkMojangStudiosBackground: 'Vídeo',
  hideLightningFlashes: 'Vídeo',
  overrideWidth: 'Vídeo',
  overrideHeight: 'Vídeo',
  glDebugVerbosity: 'Vídeo',
  menuBackgroundBlurriness: 'Vídeo',
  panoramaScrollSpeed: 'Vídeo',
  hideSplashTexts: 'Vídeo',

  soundDevice: 'Áudio',
  directionalAudio: 'Áudio',
  musicToast: 'Áudio',
  musicFrequency: 'Áudio',

  autoJump: 'Controles',
  rotateWithMinecart: 'Controles',
  invertXMouse: 'Controles',
  invertYMouse: 'Controles',
  bobView: 'Controles',
  toggleCrouch: 'Controles',
  toggleSprint: 'Controles',
  toggleAttack: 'Controles',
  toggleUse: 'Controles',
  sprintWindow: 'Controles',
  mouseSensitivity: 'Controles',
  mainHand: 'Controles',
  attackIndicator: 'Controles',
  mouseWheelSensitivity: 'Controles',
  rawMouseInput: 'Controles',
  allowCursorChanges: 'Controles',
  discrete_mouse_scroll: 'Controles',
  operatorItemsTab: 'Controles',
  autoSuggestions: 'Controles',

  chatColors: 'Chat',
  chatLinks: 'Chat',
  chatLinksPrompt: 'Chat',
  chatVisibility: 'Chat',
  chatOpacity: 'Chat',
  chatLineSpacing: 'Chat',
  textBackgroundOpacity: 'Chat',
  backgroundForChatOnly: 'Chat',
  hideServerAddress: 'Chat',
  advancedItemTooltips: 'Chat',
  chatHeightFocused: 'Chat',
  chatDelay: 'Chat',
  chatHeightUnfocused: 'Chat',
  chatScale: 'Chat',
  chatWidth: 'Chat',
  notificationDisplayTime: 'Chat',
  onlyShowSecureChat: 'Chat',
  saveChatDrafts: 'Chat',
  hideMatchedNames: 'Chat',

  narrator: 'Acessibilidade',
  showSubtitles: 'Acessibilidade',
  highContrast: 'Acessibilidade',
  highContrastBlockOutline: 'Acessibilidade',
  narratorHotkey: 'Acessibilidade',
  damageTiltStrength: 'Acessibilidade',
  darknessEffectScale: 'Acessibilidade',
  onboardAccessibility: 'Acessibilidade',

  lang: 'Geral',
  resourcePacks: 'Geral',
  incompatibleResourcePacks: 'Geral',
  lastServer: 'Geral',
  useNativeTransport: 'Geral',
  tutorialStep: 'Geral',
  skipMultiplayerWarning: 'Geral',
  joinedFirstServer: 'Geral',
  syncChunkWrites: 'Geral',
  showAutosaveIndicator: 'Geral',
  allowServerListing: 'Geral',
  inGameNotification: 'Geral',
  sharePresence: 'Geral',
  telemetryOptInExtra: 'Geral',
  startedCleanly: 'Geral',
  realmsNotifications: 'Geral',
  pauseOnLostFocus: 'Geral',
}

/** Real min/max as used by the game's own sliders — most floats are 0–1, these are the exceptions. */
const FLOAT_RANGE_BY_KEY: Record<string, [number, number]> = {
  entityDistanceScaling: [0.5, 5],
  mouseSensitivity: [0, 2],
  mouseWheelSensitivity: [0.01, 10],
  chatDelay: [0, 6],
  gamma: [0, 1],
}

export function floatRangeForKey(key: string): [number, number] {
  return FLOAT_RANGE_BY_KEY[key] ?? [0, 1]
}

export function categoryForOptionKey(key: string): OptionCategory {
  if (key.startsWith('soundCategory_')) return 'Áudio'
  if (key.startsWith('modelPart_')) return 'Aparência'
  return CATEGORY_BY_KEY[key] ?? 'Geral'
}

function inferType(rawValue: string): OptionValueType {
  if (rawValue === 'true' || rawValue === 'false') return 'boolean'
  if (/^-?\d+$/.test(rawValue)) return 'integer'
  if (/^-?\d*\.\d+$/.test(rawValue)) return 'float'
  return 'string'
}

function toEditable(rawValue: string, type: OptionValueType): string {
  if (type === 'string' && rawValue.length >= 2 && rawValue.startsWith('"') && rawValue.endsWith('"')) {
    return rawValue.slice(1, -1)
  }
  return rawValue
}

export function toRawValue(editableValue: string, originalRawValue: string, type: OptionValueType): string {
  if (type === 'string' && originalRawValue.startsWith('"')) return `"${editableValue}"`
  return editableValue
}

export function humanizeOptionKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[._]/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Every `options.txt` entry except keybinds (`key_*`) and internal fields. */
export function parseMinecraftOptions(optionsTxt: string): ParsedOption[] {
  const result: ParsedOption[] = []
  for (const rawLine of optionsTxt.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    if (!line.trim()) continue
    const match = line.match(LINE)
    if (!match) continue
    const [, key, rawValue] = match
    if (key.startsWith('key_') || SKIP_KEYS.has(key)) continue
    const type = inferType(rawValue)
    result.push({
      key,
      label: humanizeOptionKey(key),
      rawValue,
      editableValue: toEditable(rawValue, type),
      type,
      category: categoryForOptionKey(key),
    })
  }
  return result
}

/** Rewrites the given non-keybind option lines from `updates` (key -> new raw value), leaving everything else untouched. */
export function applyMinecraftOptionUpdates(optionsTxt: string, updates: Record<string, string>): string {
  return optionsTxt
    .split('\n')
    .map((rawLine) => {
      const line = rawLine.replace(/\r$/, '')
      const match = line.match(LINE)
      if (!match) return rawLine
      const [, key] = match
      return key in updates ? `${key}:${updates[key]}` : rawLine
    })
    .join('\n')
}
