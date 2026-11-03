import { Description, Label, TextArea, TextField } from '@heroui/react'
import { JOB_MAX_LENGTH, JOB_MIN_LENGTH } from '@shared/job'
import { useAppStore } from '@/common/store/app-store'
import { setJob, useWorkspaceStore } from '../store'

/** The job description itself, which every later step reads. */
export default function JobDescriptionField() {
  const job = useWorkspaceStore((s) => s.job),
    busy = useAppStore((s) => s.busy)
  return (
    <section className="job-section">
      <TextField
        value={job}
        onChange={setJob}
        isDisabled={busy}
        maxLength={JOB_MAX_LENGTH}
        fullWidth
      >
        <div className="section-title">
          <Label>Target job description</Label>
          <span>At least {JOB_MIN_LENGTH} characters</span>
        </div>
        <TextArea placeholder="Paste the job description here…" rows={10} />
        <Description className="field-footer">
          <span>Include the responsibilities, required skills and qualifications.</span>
          <span>
            {job.length.toLocaleString()} / {JOB_MAX_LENGTH.toLocaleString()}
          </span>
        </Description>
      </TextField>
    </section>
  )
}
