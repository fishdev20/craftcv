/**
 * A first guess at a job's role, company and location from its text, for the person to
 * confirm. What the job requires is read only by AI, when the person asks for it.
 */
const ROLE =
  /\b(?:engineer|developer|programmer|architect|designer|manager|lead|scientist|analyst|specialist|consultant|administrator|intern|trainee|director|head of|devops|SRE|tester|owner)\b/i
// a name stays on its line: words joined by spaces, never by a line break
const NAME = "[A-Z][\\w&.'-]*(?:[ \\t]+(?:[A-Z][\\w&.'-]*|&|of|and)){0,4}"
const NOT_COMPANY = /^(?:you|us|the|our|this|we|it|them|team|the role|the team|role)$/i
const COMPANY_PATTERNS = [
  /^(?:company|employer|organi[sz]ation)\s*[:-]\s*(.+)$/im,
  new RegExp(`^(${NAME})\\s+(?:is|are)\\s+(?:hiring|looking|seeking|searching|growing)\\b`, 'm'),
  new RegExp(`^about\\s+(${NAME})\\s*:?\\s*$`, 'im'),
  new RegExp(`\\b(?:at|join|joining)\\s+(${NAME})`),
]

/** A first guess at the job's role, company and location from its text; empty when unsure. */
export function guessJobDetails(description: string): {
  role: string
  company: string
  location: string
} {
  const lines = description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const head = lines.slice(0, 15)
  const titled = head.find((line) => /^(?:job )?title\s*[:-]/i.test(line))
  const roleLine =
    titled?.replace(/^(?:job )?title\s*[:-]\s*/i, '') ??
    head.find((line) => ROLE.test(line) && line.length <= 90 && !/[.!?]$/.test(line)) ??
    ''
  // "Engineer at Company" carries both
  const at = /^(.+?)\s+(?:at|@)\s+(.+)$/.exec(roleLine)
  const role = (at?.[1] ?? roleLine).replace(/\s*[|–—-]\s*$/, '').trim()
  let company = at?.[2]?.trim() ?? ''
  if (!company) {
    const text = lines.slice(0, 40).join('\n')
    for (const pattern of COMPANY_PATTERNS) {
      const match = pattern
        .exec(text)?.[1]
        ?.trim()
        .replace(/[.,:;]+$/, '')
      if (match && !NOT_COMPANY.test(match) && match.length <= 60) {
        company = match
        break
      }
    }
  }
  const located = /^(?:location|based in|office|where)\s*[:-]\s*(.+)$/im.exec(description)?.[1]
  const mode = /\b(remote|hybrid|on-?site)\b/i.exec(description)?.[1]
  const location =
    located?.trim() ?? (mode ? mode[0].toUpperCase() + mode.slice(1).toLowerCase() : '')
  return {
    role: role.slice(0, 200),
    company: company.slice(0, 200),
    location: location.slice(0, 200),
  }
}
