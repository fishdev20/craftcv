import logo from '../../../../build/icon.svg'

/** The app mark, from the same file the packaged app icon is built from. */
export default function Logo({ size }: { size: number }) {
  return (
    <img src={logo} alt="" width={size} height={size} className="brand-logo" draggable={false} />
  )
}
