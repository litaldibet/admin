import type { ChangeEvent } from "react"
import "../assets/css/StyledFileInput.css"

type StyledFileInputProps = {
  text: string
  accept?: string
  onFileSelect?: (file: File | null) => void
}

export default function StyledFileInput({ text, accept, onFileSelect }: StyledFileInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    onFileSelect?.(file)

    // Keep the native input clean so future selections always trigger change.
    event.target.value = ""
  }

  return (
    <label className="styled-file-input-root">
      <span className="styled-file-input-button">{text}</span>
      <input
        type="file"
        accept={accept}
        className="styled-file-input-native"
        onChange={handleChange}
      />
    </label>
  )
}
