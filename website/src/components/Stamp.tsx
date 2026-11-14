/** A round stamp: the app mark inside a ring of words, set on a circle. */
export function Stamp() {
  const words = 'CRAFTCV · OPEN SOURCE · MIT LICENCE · '
  return (
    <svg className="stamp" viewBox="0 0 120 120" role="img" aria-label="CraftCV, open source">
      <defs>
        <path id="stamp-ring" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <text>
        <textPath href="#stamp-ring" startOffset="0" textLength="272">
          {words}
        </textPath>
      </text>
      <circle cx="60" cy="60" r="31" />
      <circle cx="60" cy="60" r="56" />
      <image href="/logo.svg" x="44" y="44" width="32" height="32" />
    </svg>
  )
}
