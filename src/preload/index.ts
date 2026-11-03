import { contextBridge, ipcRenderer } from 'electron'
import type { CraftAPI, JobAnalysisEvent, Progress } from '../shared/contracts'
const api: CraftAPI = {
  getRuntimeInfo: () => ipcRenderer.invoke('craftcv:getRuntimeInfo'),
  dashboard: () => ipcRenderer.invoke('craftcv:dashboard'),
  selectRepository: () => ipcRenderer.invoke('craftcv:selectRepository'),
  importRepositoryFolder: () => ipcRenderer.invoke('craftcv:importRepositoryFolder'),
  removeRepository: (id) => ipcRenderer.invoke('craftcv:removeRepository', id),
  removeProject: (id) => ipcRenderer.invoke('craftcv:removeProject', id),
  analyzeProject: (request) => ipcRenderer.invoke('craftcv:analyzeProject', request),
  importResume: () => ipcRenderer.invoke('craftcv:importResume'),
  getResume: (id) => ipcRenderer.invoke('craftcv:getResume', id),
  createResume: (sessionId) => ipcRenderer.invoke('craftcv:createResume', sessionId),
  saveResume: (request) => ipcRenderer.invoke('craftcv:saveResume', request),
  exportDocument: (id, format) => ipcRenderer.invoke('craftcv:exportDocument', { id, format }),
  deleteResume: (id) => ipcRenderer.invoke('craftcv:deleteResume', id),
  analyze: (request) => ipcRenderer.invoke('craftcv:analyze', request),
  cancel: () => ipcRenderer.invoke('craftcv:cancel'),
  getSession: (id) => ipcRenderer.invoke('craftcv:getSession', id),
  deleteSession: (id) => ipcRenderer.invoke('craftcv:deleteSession', id),
  importJobLink: (link) => ipcRenderer.invoke('craftcv:importJobLink', link),
  openJobPage: () => ipcRenderer.invoke('craftcv:openJobPage'),
  useJobPage: () => ipcRenderer.invoke('craftcv:useJobPage'),
  closeJobPage: () => ipcRenderer.invoke('craftcv:closeJobPage'),
  createApplication: (job) => ipcRenderer.invoke('craftcv:createApplication', job),
  getApplication: (id) => ipcRenderer.invoke('craftcv:getApplication', id),
  updateApplication: (request) => ipcRenderer.invoke('craftcv:updateApplication', request),
  setApplicationStatus: (id, status) =>
    ipcRenderer.invoke('craftcv:setApplicationStatus', { id, status }),
  deleteApplication: (id) => ipcRenderer.invoke('craftcv:deleteApplication', id),
  enrichJob: (request) => ipcRenderer.invoke('craftcv:enrichJob', request),
  openApplicationLink: (id) => ipcRenderer.invoke('craftcv:openApplicationLink', id),
  generate: (request) => ipcRenderer.invoke('craftcv:generate', request),
  review: (request) => ipcRenderer.invoke('craftcv:review', request),
  saveKey: (provider, key) => ipcRenderer.invoke('craftcv:saveKey', { provider, key }),
  connectChatGPT: () => ipcRenderer.invoke('craftcv:connectChatGPT'),
  disconnectChatGPT: () => ipcRenderer.invoke('craftcv:disconnectChatGPT'),
  refreshChatGPTModels: () => ipcRenderer.invoke('craftcv:refreshChatGPTModels'),
  exportResume: (sessionId, format) =>
    ipcRenderer.invoke('craftcv:exportResume', { sessionId, format }),
  copy: (text) => ipcRenderer.invoke('craftcv:copy', text),
  openPage: (page) => ipcRenderer.invoke('craftcv:openPage', page),
  onProgress: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: Progress) => callback(progress)
    ipcRenderer.on('craftcv:progress', listener)
    return () => ipcRenderer.removeListener('craftcv:progress', listener)
  },
  onJobAnalysis: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, event: JobAnalysisEvent) => callback(event)
    ipcRenderer.on('craftcv:jobAnalysis', listener)
    return () => ipcRenderer.removeListener('craftcv:jobAnalysis', listener)
  },
}
contextBridge.exposeInMainWorld('craftcv', api)
