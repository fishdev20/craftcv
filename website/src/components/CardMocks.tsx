import { Ico } from './Ico'

// the feature cards' live mocks: CraftCV's actions as tilted pills, three fanned templates and
// the applications board

const actions = [
  { icon: 'lucide:link', label: 'Import from a job link' },
  { icon: 'vscode-icons:file-type-pdf2', label: 'Import your CV' },
  { icon: 'vscode-icons:default-folder', label: 'Add a project folder' },
  { icon: 'lucide:list-checks', label: 'Check requirements' },
  { icon: 'vscode-icons:file-type-word', label: 'Export to Word' },
]

/** The things CraftCV does, as tilted pills (the Tailor a CV card). */
export function Actions() {
  return (
    <>
      {actions.map((action, index) => (
        <span className={`action action--${index % 2 ? 'right' : 'left'}`} key={action.label}>
          <Ico name={action.icon} />
          {action.label}
        </span>
      ))}
    </>
  )
}

/** Three CV templates, fanned (the Templates card). */
export function Templates() {
  const sheets = [
    { name: 'Alex Kim', role: 'Frontend engineer', look: 'sheet--a' },
    { name: 'Priya Shah', role: 'Backend engineer', look: 'sheet--b' },
    { name: 'Sam Lee', role: 'Data engineer', look: 'sheet--c' },
  ]
  return (
    <>
      {sheets.map((sheet) => (
        <div className={`sheet ${sheet.look}`} key={sheet.name}>
          <b className="sheet__name">{sheet.name}</b>
          <span className="sheet__role">{sheet.role}</span>
          <span className="sheet__rule" />
          <span className="ph" style={{ width: '92%' }} />
          <span className="ph" style={{ width: '78%' }} />
          <span className="ph" style={{ width: '86%' }} />
          <span className="sheet__rule" />
          <span className="ph ph--strong" style={{ width: '50%' }} />
          <span className="ph" style={{ width: '88%' }} />
          <span className="ph" style={{ width: '70%' }} />
        </div>
      ))}
    </>
  )
}

// the applications board in the app's own statuses, with made-up jobs
const board = [
  {
    status: 'Preparing',
    jobs: [
      { role: 'UI Engineer', company: 'Kestrel', score: 52 },
      { role: 'Design Engineer', company: 'Pallas', score: 61 },
    ],
  },
  {
    status: 'Applied',
    jobs: [
      { role: 'Product Engineer', company: 'Arbor', score: 64 },
      { role: 'Frontend Developer', company: 'Lumen', score: 70 },
    ],
  },
  { status: 'Interviewing', jobs: [{ role: 'Senior Frontend', company: 'Halden', score: 78 }] },
  { status: 'Offer', jobs: [{ role: 'Staff Engineer', company: 'Northwind', score: 84 }] },
]

/** The applications board as live markup (the Track applications card). */
export function ApplicationsBoard() {
  return (
    <div className="board" aria-hidden="true">
      {board.map((column) => (
        <div key={column.status} className="board__col">
          <span className="board__head">
            {column.status}
            <b>{column.jobs.length}</b>
          </span>
          {column.jobs.map((job) => (
            <span key={job.role} className="board__job">
              <b>{job.role}</b>
              <small>{job.company} · Remote</small>
              <span className="board__score">
                <i style={{ '--s': job.score / 100 } as React.CSSProperties} />
                {job.score}% match
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
