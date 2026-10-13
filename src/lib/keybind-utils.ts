import { categoryForAction, humanizeAction } from './keybind-labels'
import type { KeybindCategory } from './keybind-labels'
export { humanizeKey, KEYBIND_CATEGORY_ORDER } from './keybind-labels'
export interface ParsedKeybind {
  action: string
  label: string
  value: string
  category: KeybindCategory
}
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
  if (/^Key[A-Z]$/.test(code))
    return `key.keyboard.${code.slice(3).toLowerCase()}`
  if (/^Digit[0-9]$/.test(code)) return `key.keyboard.${code.slice(5)}`
  if (/^F[0-9]{1,2}$/.test(code)) return `key.keyboard.${code.toLowerCase()}`
  return `key.keyboard.${code.toLowerCase()}`
}
const KEY_LINE = /^key_(.+):(.*)$/
const VANILLA_PREFIX = 'key.'
function actionFromRawKey(rawKey: string): string {
  return rawKey.startsWith(VANILLA_PREFIX)
    ? rawKey.slice(VANILLA_PREFIX.length)
    : rawKey
}
export function parseKeybinds(optionsTxt: string): ParsedKeybind[] {
  const result: ParsedKeybind[] = []
  for (const rawLine of optionsTxt.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    const match = line.match(KEY_LINE)
    if (!match) continue
    const [, rawKey, value] = match
    const action = actionFromRawKey(rawKey)
    result.push({
      action,
      label: humanizeAction(action),
      value,
      category: categoryForAction(action),
    })
  }
  return result
}
export function applyKeybinds(
  optionsTxt: string,
  updates: Record<string, string>,
): string {
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
export function findKeybindConflicts(
  binds: ParsedKeybind[],
  overrides: Record<string, string>,
): Map<string, string[]> {
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
