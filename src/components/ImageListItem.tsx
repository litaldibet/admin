import "../assets/css/ImageListItem.css"
import StyledFileInput from "./StyledFileInput"
import { Check } from "lucide-react"

type ImageListItemProps = {
  id: number
  isBusy: boolean
  hasSelectedFile: boolean
  displayName: string
  canConfirmName: boolean
  statusText?: string
  errorText?: string | null
  onPickFile: (id: number, file: File | null) => void
  onChangeName: (id: number, value: string) => void
  onConfirmName: (id: number) => void
  onRemove: (id: number) => void
}

export default function ImageListItem({
  id,
  isBusy,
  hasSelectedFile,
  displayName,
  canConfirmName,
  statusText,
  errorText,
  onPickFile,
  onChangeName,
  onConfirmName,
  onRemove
}: ImageListItemProps) {
  function handleFileSelect(file: File | null) {
    onPickFile(id, file)
  }

  function handleRemove() {
    onRemove(id)
  }

  function handleConfirmName() {
    onConfirmName(id)
  }

  return (
    <div className="image-list-item">
      <div className="image-list-item-controls">
        <StyledFileInput
          text={hasSelectedFile ? "Trocar Imagem" : "Escolher imagem"}
          accept="image/*"
          onFileSelect={handleFileSelect}
        />

        {hasSelectedFile ? (
          <div className="image-list-item-name-wrap">
            <input
              type="text"
              className="image-list-item-name-input"
              placeholder="Nome"
              value={displayName}
              onChange={(event) => onChangeName(id, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleConfirmName()
                }
              }}
            />
            <button
              type="button"
              className="image-list-item-name-confirm"
              onClick={handleConfirmName}
              disabled={!canConfirmName || isBusy}
              aria-label="Confirmar nome"
            >
              <Check size={18} />
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="image-list-item-delete-button"
          onClick={handleRemove}
          disabled={isBusy}
        >
          X
        </button>
      </div>

      {statusText ? <span className="image-list-item-status">{statusText}</span> : null}
      {errorText ? <span className="image-list-item-error">{errorText}</span> : null}
    </div>
  )
}
