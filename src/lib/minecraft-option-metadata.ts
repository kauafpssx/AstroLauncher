export type OptionCategory =
  | 'Vídeo'
  | 'Áudio'
  | 'Controles'
  | 'Chat'
  | 'Acessibilidade'
  | 'Aparência'
  | 'Geral'

export const OPTION_CATEGORY_ORDER: OptionCategory[] = [
  'Vídeo',
  'Áudio',
  'Controles',
  'Chat',
  'Acessibilidade',
  'Aparência',
  'Geral',
]

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
