function parseVersionParts(v: string): number[] {
  return v
    .trim()
    .split('.')
    .map((n) => parseInt(n, 10))
}

// Compara duas versões numéricas (ex.: "1.18" vs "1.20.1"). Retorna null se
// alguma não for parseável como número.número.número (ex.: nomes de
// snapshot) — chamador decide o fallback nesse caso.
function compareMcVersions(a: string, b: string): number | null {
  const av = parseVersionParts(a)
  const bv = parseVersionParts(b)
  if (av.some(Number.isNaN) || bv.some(Number.isNaN)) return null
  for (let i = 0; i < Math.max(av.length, bv.length); i++) {
    const x = av[i] ?? 0
    const y = bv[i] ?? 0
    if (x !== y) return x < y ? -1 : 1
  }
  return 0
}

export function isMcVersionAtLeast(
  reference: string,
  mcVersion: string,
): boolean {
  if (/^(alpha|beta)/i.test(reference)) return true
  const cmp = compareMcVersions(reference, mcVersion)
  return cmp === null ? true : cmp <= 0
}

export function isMcVersionInRange(
  addedIn: string,
  mcVersion: string,
  removedIn?: string,
): boolean {
  if (addedIn === 'desconhecida') return true
  if (!isMcVersionAtLeast(addedIn, mcVersion)) return false
  if (!removedIn) return true
  const cmp = compareMcVersions(mcVersion, removedIn)
  return cmp === null ? true : cmp < 0
}
