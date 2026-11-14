import { Stamp } from './Stamp'
import { DOWNLOAD, RELEASES, REPO } from '@/lib/site'

const footer = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Privacy', href: '/#privacy' },
      { label: 'Download', href: DOWNLOAD },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Source code', href: REPO },
      { label: 'Releases', href: RELEASES },
      { label: 'Report an issue', href: `${REPO}/issues` },
      { label: 'Security', href: `${REPO}/blob/main/SECURITY.md` },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'MIT licence', href: `${REPO}/blob/main/LICENSE` },
      { label: 'Contributing', href: `${REPO}/pulls` },
    ],
  },
  {
    title: 'Connect',
    links: [{ label: 'GitHub', href: REPO }],
  },
]

/** The site's footer: mono link columns and the stamp, a copyright bar, then the wordmark. */
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__cols">
        {footer.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2>{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <Stamp />
      </div>
      <div className="footer__bar">
        <span>
          Copyright <span className="footer__gap">© {new Date().getFullYear()}</span>
        </span>
        <span className="footer__credit">
          Designed and built by
          <br />
          CraftCV contributors
        </span>
        <span aria-hidden="true" />
      </div>
      {/* the name set large across the foot, fading into the page */}
      <div className="footer__wordmark">
        <p className="footer__name" aria-hidden="true">
          CraftCV
        </p>
      </div>
    </footer>
  )
}
