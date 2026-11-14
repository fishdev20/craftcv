/**
 * A Mac window around a real screenshot of the app (`src`), or around live markup standing in
 * for one (`children`): traffic lights, a path and the picture.
 */
export function AppWindow({
  src,
  path,
  tint,
  className,
  children,
}: {
  src?: string
  path: string
  tint?: 'warm' | 'cool'
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`app-window${className ? ` ${className}` : ''}`} data-tint={tint}>
      <div className="app-window__bar">
        <span className="app-window__lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="app-window__path">
          <span>CraftCV /</span> {path}
        </span>
      </div>
      {children ?? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={1440} height={900} loading="lazy" />
      )}
    </div>
  )
}
