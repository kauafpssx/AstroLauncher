export interface LogSegment {
  text: string
  color: string
}

const LEVEL_COLORS: Record<
  string,
  {
    bracket: string
    timestamp: string
    thread: string
    level: string
    slash: string
    divider: string
    message: string
  }
> = {
  INFO: {
    bracket: '#94a3b8',
    timestamp: '#60a5fa',
    thread: '#94a3b8',
    level: '#22d3ee',
    slash: '#94a3b8',
    divider: '#94a3b8',
    message: '',
  },
  WARN: {
    bracket: '#94a3b8',
    timestamp: '#fbbf24',
    thread: '#a16207',
    level: '#eab308',
    slash: '#94a3b8',
    divider: '#94a3b8',
    message: '#d97706',
  },
  ERROR: {
    bracket: '#94a3b8',
    timestamp: '#fca5a5',
    thread: '#ef4444',
    level: '#ef4444',
    slash: '#94a3b8',
    divider: '#94a3b8',
    message: '#f87171',
  },
  FATAL: {
    bracket: '#94a3b8',
    timestamp: '#fca5a5',
    thread: '#dc2626',
    level: '#dc2626',
    slash: '#94a3b8',
    divider: '#94a3b8',
    message: '#ef4444',
  },
}

const LOG_LINE_RE =
  /^(\[[\d:]+\] )(\[[\w #.-]+\/)(INFO|WARN|ERROR|FATAL)(\]: )(.*)$/
const STACK_RE = /^\s+(at |\.\.\. \d+ more)/

export interface ParsedLine {
  segments: LogSegment[]
}

function defaultStyle() {
  return {
    bracket: '#94a3b8',
    timestamp: '#60a5fa',
    thread: '#94a3b8',
    level: '#22d3ee',
    slash: '#94a3b8',
    divider: '#94a3b8',
    message: '',
  }
}

export function parseLogLine(line: string): LogSegment[] {
  const m = line.match(LOG_LINE_RE)
  if (m) {
    const [, tsBlock, threadBlock, level, divider, message] = m
    const c = LEVEL_COLORS[level] ?? defaultStyle()

    return [
      { text: tsBlock, color: c.timestamp },
      { text: threadBlock, color: c.thread },
      { text: level, color: c.level },
      { text: divider, color: c.divider },
      ...parseMsg(message, level, c.message),
    ]
  }

  if (line.match(STACK_RE)) {
    return [{ text: line, color: '#f87171' }]
  }

  if (line.match(/^(Caused by:|Suppressed:)/)) {
    return [{ text: line, color: '#ef4444' }]
  }

  if (line.match(/^[\t ]*[|\\]/)) {
    return [{ text: line, color: '#64748b' }]
  }

  return [{ text: line, color: '' }]
}

function parseMsg(
  message: string,
  level: string,
  msgColor: string,
): LogSegment[] {
  if (level === 'INFO' && message.startsWith('[System] [CHAT]')) {
    return [
      { text: '[System] [CHAT] ', color: '#4ade80' },
      { text: message.slice(18), color: '#22c55e' },
    ]
  }

  if (msgColor) {
    return [{ text: message, color: msgColor }]
  }

  return [{ text: message, color: '' }]
}

export function parseLogContent(content: string): LogSegment[][] {
  return content.split('\n').map((line) => parseLogLine(line))
}
