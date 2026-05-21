import { useState } from "react"
import { UploadImageButton } from "@/features/upload-image/ui/UploadImageButton"
import type { UploadImageData } from "@/features/upload-image/model/uploadImage.types"
import {
  logApiError,
  mapGenerateImageError,
  mapUploadImageError,
} from "@/shared/api/errors/errorMapper"
import styles from "./ProfileEmptyState.module.css"

type Props = {
  onUpload: (data: UploadImageData) => Promise<void>
  onGenerate: (data: {
    prompt: string
    description?: string
    tags?: string[]
  }) => Promise<void>
}

export const ProfileEmptyState = ({ onUpload, onGenerate }: Props) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isGenerateFormOpen, setIsGenerateFormOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [generateDescription, setGenerateDescription] = useState("")
  const [prompt, setPrompt] = useState("")
  const [tags, setTags] = useState("")
  const [generateTags, setGenerateTags] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const resetUploadForm = () => {
    setSelectedFile(null)
    setDescription("")
    setTags("")
    setFormError(null)
  }

  const resetGenerateForm = () => {
    setIsGenerateFormOpen(false)
    setPrompt("")
    setGenerateDescription("")
    setGenerateTags("")
    setFormError(null)
  }

  const handleSelectFile = (file: File) => {
    resetGenerateForm()
    setFormError(null)
    setSelectedFile(file)
  }

  const openGenerateForm = () => {
    resetUploadForm()
    setFormError(null)
    setIsGenerateFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedFile || isUploading) return

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    setIsUploading(true)
    setFormError(null)

    try {
      await onUpload({
        file: selectedFile,
        description: description.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      })
      resetUploadForm()
    } catch (error) {
      const apiError = mapUploadImageError(error)

      logApiError("Could not upload image", apiError, "warn")
      setFormError(apiError.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerateSubmit = async () => {
    const normalizedPrompt = prompt.trim()
    const parsedTags = generateTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (!normalizedPrompt || isGenerating) return

    setIsGenerating(true)
    setFormError(null)

    try {
      await onGenerate({
        prompt: normalizedPrompt,
        description: generateDescription.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      })
      resetGenerateForm()
    } catch (error) {
      const apiError = mapGenerateImageError(error)

      logApiError("Could not generate image", apiError, "warn")
      setFormError(apiError.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={styles.empty}>
      <div className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img">
          <path d="M21 8l4 13 13 3-13 4-4 13-4-13-13-4 13-3 4-13z" />
          <path d="M37 7v10M32 12h10" />
        </svg>
      </div>

      <h2 className={styles.title}>No photos yet</h2>

      <p className={styles.text}>
        Start building your collection by uploading photos or generating them
        with AI
      </p>

      {selectedFile && (
        <div className={styles.uploadForm}>
          <div className={styles.fileName}>{selectedFile.name}</div>
          {formError && <div className={styles.formError}>{formError}</div>}

          <textarea
            className={styles.textarea}
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <input
            className={styles.input}
            placeholder="Tags, separated by commas"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />

          <div className={styles.formActions}>
            <button className={styles.cancelButton} type="button" onClick={resetUploadForm}>
              Cancel
            </button>
            <button className={styles.submitButton} type="button" onClick={handleSubmit}>
              {isUploading ? "Uploading..." : "Save photo"}
            </button>
          </div>
        </div>
      )}

      {isGenerateFormOpen && (
        <div className={styles.uploadForm}>
          {formError && <div className={styles.formError}>{formError}</div>}

          <textarea
            className={styles.textarea}
            placeholder="Prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />

          <textarea
            className={styles.textarea}
            placeholder="Description"
            value={generateDescription}
            onChange={(event) => setGenerateDescription(event.target.value)}
          />

          <input
            className={styles.input}
            placeholder="Tags, separated by commas"
            value={generateTags}
            onChange={(event) => setGenerateTags(event.target.value)}
          />

          <div className={styles.formActions}>
            <button className={styles.cancelButton} type="button" onClick={resetGenerateForm}>
              Cancel
            </button>
            <button
              className={styles.submitButton}
              type="button"
              onClick={handleGenerateSubmit}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate image"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.buttons}>
        <UploadImageButton className={styles.upload} onSelect={handleSelectFile}>
          Upload Photo
        </UploadImageButton>
        <button
          className={styles.generate}
          type="button"
          onClick={openGenerateForm}
        >
          <span className={styles.buttonIcon}>+</span>
          Generate with AI
        </button>
      </div>
    </div>
  )
}
