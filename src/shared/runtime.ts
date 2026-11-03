import type { CraftAPI } from './contracts'

export const BRIDGE_VERSION = 10
// This mapped type makes adding an API without updating the runtime check a compile error.
const methods: Record<keyof CraftAPI, true> = {
  getRuntimeInfo: true,
  dashboard: true,
  selectRepository: true,
  importRepositoryFolder: true,
  removeRepository: true,
  removeProject: true,
  analyzeProject: true,
  importResume: true,
  getResume: true,
  createResume: true,
  saveResume: true,
  exportDocument: true,
  deleteResume: true,
  analyze: true,
  cancel: true,
  getSession: true,
  deleteSession: true,
  importJobLink: true,
  openJobPage: true,
  useJobPage: true,
  closeJobPage: true,
  createApplication: true,
  getApplication: true,
  updateApplication: true,
  setApplicationStatus: true,
  deleteApplication: true,
  enrichJob: true,
  openApplicationLink: true,
  generate: true,
  review: true,
  saveKey: true,
  connectChatGPT: true,
  disconnectChatGPT: true,
  refreshChatGPTModels: true,
  exportResume: true,
  copy: true,
  openPage: true,
  onProgress: true,
  onJobAnalysis: true,
}
export const RESTART_MESSAGE =
  'CraftCV’s desktop connection is out of date. Quit and reopen CraftCV. If you are running npm run dev, stop it with Ctrl+C and run npm run dev again. Your saved CVs and sessions remain on this device.'
export function hasCurrentBridge(api: unknown): api is CraftAPI {
  if (!api || typeof api !== 'object') return false
  return Object.keys(methods).every(
    (method) => typeof (api as Record<string, unknown>)[method] === 'function',
  )
}
export async function verifyRuntime(api: CraftAPI): Promise<boolean> {
  try {
    const result = await api.getRuntimeInfo()
    return result.ok && result.value.bridgeVersion === BRIDGE_VERSION
  } catch {
    return false
  }
}
