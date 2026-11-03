/**
 * The value an unfinished JSON text holds so far, as if it ended here: an open string is
 * closed, a key still waiting for its value is dropped, and open arrays and objects are
 * closed. Undefined when nothing readable has arrived yet.
 */
export function parsePartialJson(text: string): unknown {
  const closers: string[] = []
  let inString = false
  let escaped = false
  for (const char of text) {
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') closers.push('}')
    else if (char === '[') closers.push(']')
    else if (char === '}' || char === ']') closers.pop()
  }
  let body = text
  if (inString) body = (escaped ? body.slice(0, -1) : body) + '"'
  // a value not yet started, or a key without its value, cannot be read yet
  body = body
    .replace(/,\s*$/, '')
    .replace(/,?\s*"(?:[^"\\]|\\.)*"\s*:\s*$/, '')
    .replace(/:\s*$/, '')
  // an object key whose string just closed and has no colon yet
  if (closers.at(-1) === '}') body = body.replace(/([{,])\s*"(?:[^"\\]|\\.)*"\s*$/, '$1')
  body = body.replace(/,\s*$/, '')
  try {
    return JSON.parse(body + closers.reverse().join(''))
  } catch {
    return undefined
  }
}
