#!/usr/bin/env node
// Extrahiert die Dialog-Texte (User/Assistant) aus einem Claude-Code-Transcript
// (.jsonl). Tool-Aufrufe und Tool-Ergebnisse werden übersprungen.
//
// Usage: node extract-transcript.mjs <session.jsonl> [maxCharsPerBlock=400]
import { readFileSync } from 'node:fs'

const file = process.argv[2]
const maxChars = Number(process.argv[3] ?? 400)
if (!file) {
  console.error('Usage: node extract-transcript.mjs <session.jsonl> [maxCharsPerBlock]')
  process.exit(1)
}

for (const line of readFileSync(file, 'utf8').split('\n')) {
  if (!line.trim()) continue
  let e
  try {
    e = JSON.parse(line)
  } catch {
    continue
  }
  if (e.type !== 'user' && e.type !== 'assistant') continue
  const c = e.message?.content
  const texts = []
  if (typeof c === 'string') texts.push(c)
  else if (Array.isArray(c))
    for (const b of c) if (b.type === 'text' && b.text) texts.push(b.text)
  for (const t of texts) {
    const s = t.replace(/\s+/g, ' ').trim()
    if (!s || s.startsWith('<system-reminder>')) continue
    console.log(
      `${e.type.toUpperCase()}: ${s.slice(0, maxChars)}${s.length > maxChars ? ' …' : ''}`,
    )
  }
}
