import { Button } from '@heroui/react'
import ActionIcon from '@/common/ui/ActionIcon'
import SelectField from '@/common/ui/SelectField'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { useAppStore } from '@/common/store/app-store'
import { importCv, startBlankCv } from '../actions'
import { selectResume, useWorkspaceStore } from '../store'

/** The master CV the application is tailored from: chosen, imported, or started blank. */
export default function ResumePicker() {
  const resumes = useAppStore((s) => s.dashboard?.resumes),
    busy = useAppStore((s) => s.busy),
    resumeId = useWorkspaceStore((s) => s.resumeId)
  const { pending, run } = usePendingAction()
  const chosen = resumes?.some((resume) => resume.id === resumeId) ? resumeId : null
  return (
    <div className="resume-picker">
      {resumes?.length ? (
        <SelectField
          label="Master CV"
          className="resume-select"
          options={[
            ...(chosen ? [] : [{ id: 'none', label: 'Choose a CV' }]),
            ...resumes.map((r) => ({ id: r.id, label: r.name })),
          ]}
          value={chosen ?? 'none'}
          onChange={(id) => selectResume(id === 'none' ? null : id)}
          isDisabled={busy}
        />
      ) : null}
      <Button
        variant="outline"
        fullWidth
        className="import-zone"
        onClick={() => void run('import', importCv)}
        isPending={pending === 'import'}
        isDisabled={busy}
      >
        <span className="upload-icon">
          <ActionIcon pending={pending === 'import'} icon="lucide:upload" width={19} />
        </span>
        <span>
          <strong>
            {pending === 'import'
              ? 'Importing CV…'
              : resumes?.length
                ? 'Import another CV'
                : 'Import your CV'}
          </strong>
          <small>PDF, DOCX, or Markdown · up to 10 MB · layout and pages are kept</small>
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        isDisabled={busy || pending !== null}
        isPending={pending === 'blank'}
        onPress={() => void run('blank', startBlankCv)}
      >
        <ActionIcon pending={pending === 'blank'} icon="lucide:plus" width={14} />
        {pending === 'blank' ? 'Creating CV…' : 'No CV yet? Start a blank one'}
      </Button>
    </div>
  )
}
