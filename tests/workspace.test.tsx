// @vitest-environment jsdom
import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Workspace from '../src/renderer/features/workspace/WorkspacePage'
import { useAppStore } from '../src/renderer/common/store/app-store'
import { useOnboardingStore } from '../src/renderer/features/onboarding/onboarding'
import { useWorkspaceStore } from '../src/renderer/features/workspace/store'
// HeroUI's tabs measure and animate themselves; jsdom has no layout or animations
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
Element.prototype.getAnimations ??= () => []
// these cases are about the wizard; the first-run welcome has its own tests
useOnboardingStore.setState({ welcomed: true, setupHidden: true })
type AppState = ReturnType<typeof useAppStore.getState>
type WorkspaceState = ReturnType<typeof useWorkspaceStore.getState>
/** Sets app and workspace state together, each key in the store that owns it. */
function setState(state: Partial<AppState> & Partial<WorkspaceState>) {
  const { job, selected, resumeId, session, step, application, ...app } = state
  useAppStore.setState(app)
  useWorkspaceStore.setState(
    Object.fromEntries(
      Object.entries({ job, selected, resumeId, session, step, application }).filter(
        ([, value]) => value !== undefined,
      ),
    ),
  )
}
it('requires the job first, then a project, before analysing', () => {
  setState({
    dashboard: {
      projects: [],
      repositories: [],
      resumes: [],
      sessions: [],
      applications: [],
      keys: { openai: false, chatgpt: false, anthropic: false },
      chatgpt: { connected: false, email: null, models: [] },
    },
    job: '',
    selected: [],
    session: null,
    application: null,
    step: 'job',
    busy: false,
  })
  const view = render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
  const next = () => screen.getByRole('button', { name: 'Analyse the job' }) as HTMLButtonElement
  expect(next().disabled).toBe(true)
  fireEvent.click(screen.getByRole('tab', { name: /Paste the text/ }))
  fireEvent.change(screen.getByLabelText('Target job description'), {
    target: { value: 'We need a React developer with testing experience.' },
  })
  expect(next().disabled).toBe(false)
  // one step per page: later steps wait until they are reached
  expect(screen.queryByText('Review your suggestions')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Analyze selected projects' })).toBeNull()
  setState({ step: 'projects' })
  view.rerender(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
  expect(
    (screen.getByRole('button', { name: 'Analyze selected projects' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true)
  cleanup()
})

it('places the AI process and requirements beside the original posting', () => {
  const description = 'Build React interfaces and test them with Playwright.'
  setState({
    dashboard: {
      projects: [],
      repositories: [],
      resumes: [],
      sessions: [],
      applications: [],
      keys: { openai: true, chatgpt: false, anthropic: false },
      chatgpt: { connected: false, email: null, models: [] },
    },
    application: {
      id: '3fc89ef4-61c8-48b9-9a90-dbf1ee77fb5d',
      createdAt: '2026-11-04T10:00:00.000Z',
      updatedAt: '2026-11-04T10:00:00.000Z',
      job: {
        role: 'Frontend Engineer',
        company: 'Acme',
        location: 'Helsinki',
        url: null,
        description,
        source: 'manual',
      },
      analysis: {
        mustHave: ['React'],
        niceToHave: ['Playwright'],
        keywords: ['accessible interfaces'],
        responsibilities: ['Build and test user interfaces.'],
        source: 'ai',
        provider: 'openai',
        model: 'gpt-5',
        analyzedAt: '2026-11-04T10:00:00.000Z',
        usage: null,
      },
      resumeId: null,
      projectIds: [],
      sessionId: null,
      step: 'analysis',
      status: 'preparing',
      history: [{ status: 'preparing', at: '2026-11-04T10:00:00.000Z' }],
      appliedAt: null,
      notes: '',
    },
    step: 'analysis',
    busy: false,
  })
  const view = render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
  const comparison = view.container.querySelector('.job-analysis-comparison')
  const source = comparison?.querySelector('.job-description')
  const result = comparison?.querySelector('.job-analysis-pane')
  expect(comparison?.children).toHaveLength(2)
  expect(source?.textContent).toContain('Original job description')
  expect(source?.textContent).toContain(description)
  expect(result?.textContent).toContain('AI analysis')
  expect(result?.textContent).toContain('Requirements')
  expect(result?.textContent).toContain('React')
  expect(result?.textContent).toContain('Build and test user interfaces.')

  const application = useWorkspaceStore.getState().application!
  setState({ application: { ...application, analysis: null } })
  view.rerender(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
  const fullWidthComparison = view.container.querySelector('.job-analysis-comparison')
  const sourceHeading = fullWidthComparison?.querySelector('.job-description-heading')
  const analyze = screen.getByRole('button', { name: 'Analyse the job' })
  expect(fullWidthComparison?.hasAttribute('data-has-ai-pane')).toBe(false)
  expect(fullWidthComparison?.querySelector('.job-analysis-pane')).toBeNull()
  expect(sourceHeading?.contains(analyze)).toBe(true)
  cleanup()
})

it('keeps project services collapsed until the disclosure is opened', () => {
  setState({
    dashboard: {
      projects: [
        {
          id: '3fc89ef4-61c8-48b9-9a90-dbf1ee77fb5d',
          name: 'Kaira',
          rootPath: '/projects/kaira',
          repositories: [
            {
              id: '9f8bff0e-4cb0-4ca8-8407-44240f2df742',
              name: 'Kaira / api',
              path: '/projects/kaira/api',
              projectId: '3fc89ef4-61c8-48b9-9a90-dbf1ee77fb5d',
            },
          ],
          analysis: null,
        },
      ],
      repositories: [],
      resumes: [],
      sessions: [],
      applications: [],
      keys: { openai: false, chatgpt: false, anthropic: false },
      chatgpt: { connected: false, email: null, models: [] },
    },
    selected: [],
    session: null,
    step: 'projects',
    busy: false,
  })
  render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
  expect(screen.queryByText('api', { exact: true })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Expand Kaira' }))
  expect(screen.getByText('api', { exact: true })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Collapse Kaira' })).toBeTruthy()
  cleanup()
})
it('creates AI understanding for every selected project after consent', async () => {
  const projects = [
    {
      id: '3fc89ef4-61c8-48b9-9a90-dbf1ee77fb5d',
      name: 'Kaira',
      rootPath: '/projects/kaira',
      repositories: [],
      analysis: null,
    },
    {
      id: '55679f85-3871-40d8-8445-3db66a8d8838',
      name: 'Omakala',
      rootPath: '/projects/omakala',
      repositories: [],
      analysis: null,
    },
  ]
  const dashboard = {
    projects,
    repositories: [],
    resumes: [],
    sessions: [],
    applications: [],
    keys: { openai: true, chatgpt: false, anthropic: false },
    chatgpt: { connected: false, email: null, models: [] },
  }
  const analyzeProject = vi.fn().mockImplementation(async ({ projectId }) => ({
    ok: true,
    value: projects.find((project) => project.id === projectId),
  }))
  window.craftcv = {
    analyzeProject,
    dashboard: vi.fn().mockResolvedValue({ ok: true, value: dashboard }),
  } as unknown as Window['craftcv']
  setState({
    dashboard,
    selected: projects.map((project) => project.id),
    session: null,
    step: 'projects',
    busy: false,
  })
  render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByText('Understand selected projects with AI'))
  fireEvent.click(screen.getByLabelText(/I consent to sharing the bounded context/))
  fireEvent.click(screen.getByRole('button', { name: 'Analyze 2 projects with AI' }))
  await vi.waitFor(() => expect(analyzeProject).toHaveBeenCalledTimes(2))
  expect(analyzeProject).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ projectId: projects[0].id, provider: 'openai', consent: true }),
  )
  expect(analyzeProject).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ projectId: projects[1].id, provider: 'openai', consent: true }),
  )
  cleanup()
})
it('does not claim success if a native dialog fails', async () => {
  setState({ step: 'projects' })
  window.craftcv = {
    selectRepository: vi.fn().mockResolvedValue({ ok: false, error: 'Git is not installed.' }),
  } as unknown as Window['craftcv']
  render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Import project folder' }))
  await vi.waitFor(() => expect(useAppStore.getState().error).toBe('Git is not installed.'))
  cleanup()
})
