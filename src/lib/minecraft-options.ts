import {
  categoryForOptionKey,
  type OptionCategory,
} from './minecraft-option-metadata'

export {
  floatRangeForKey,
  OPTION_CATEGORY_ORDER,
} from './minecraft-option-metadata'

export type OptionValueType = 'boolean' | 'integer' | 'float' | 'string'

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

function inferType(rawValue: string): OptionValueType {
  if (rawValue === 'true' || rawValue === 'false') return 'boolean'
  if (/^-?\d+$/.test(rawValue)) return 'integer'
  if (/^-?\d*\.\d+$/.test(rawValue)) return 'float'
  return 'string'
}

function toEditable(rawValue: string, type: OptionValueType): string {
  if (
    type === 'string' &&
    rawValue.length >= 2 &&
    rawValue.startsWith('"') &&
    rawValue.endsWith('"')
  ) {
    return rawValue.slice(1, -1)
  }
  return rawValue
}

export function toRawValue(
  editableValue: string,
  originalRawValue: string,
  type: OptionValueType,
): string {
  if (type === 'string' && originalRawValue.startsWith('"'))
    return `"${editableValue}"`
  return editableValue
}

function humanizeOptionKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._]/g, ' ')
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
export function applyMinecraftOptionUpdates(
  optionsTxt: string,
  updates: Record<string, string>,
): string {
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
