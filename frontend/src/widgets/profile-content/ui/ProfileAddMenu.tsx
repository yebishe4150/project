import { useEffect, useRef, useState } from "react"
import { UploadImageButton } from "@/features/upload-image/ui/UploadImageButton"
import type { UploadImageData } from "@/features/upload-image/model/uploadImage.types"
import styles from "./ProfileAddMenu.module.css"

type GeneratePayload = {
  prompt: string
  description?: string
  tags?: string[]
}

type Props = {
  onUpload: (data: UploadImageData) => Promise<void>
  onGenerate: (data: GeneratePayload) => Promise<void>
}

export const ProfileAddMenu = ({ onUpload, onGenerate }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [prompt, setPrompt] = useState("")
  const [generateDescription, setGenerateDescription] = useState("")
  const [generateTags, setGenerateTags] = useState("")
  const [isGenerateFormOpen, setIsGenerateFormOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const resetUploadForm = () => {
    setSelectedFile(null)
    setDescription("")
    setTags("")
  }

  const resetGenerateForm = () => {
    setIsGenerateFormOpen(false)
    setPrompt("")
    setGenerateDescription("")
    setGenerateTags("")
  }

  const closeMenu = () => {
    setIsOpen(false)
    resetUploadForm()
    resetGenerateForm()
  }

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu()
      }
    }

    document.addEventListener("mousedown", handlePointerDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [isOpen])

  const handleSelectFile = (file: File) => {
    resetGenerateForm()
    setSelectedFile(file)
  }

  const openGenerateForm = () => {
    resetUploadForm()
    setIsGenerateFormOpen(true)
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile || isUploading) return

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    setIsUploading(true)

    try {
      await onUpload({
        file: selectedFile,
        description: description.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      })
      closeMenu()
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

    try {
      await onGenerate({
        prompt: normalizedPrompt,
        description: generateDescription.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      })
      closeMenu()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        className={styles.trigger}
        type="button"
        aria-label="Add image"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        +
      </button>

      {isOpen && (
        <div className={styles.popover}>
          {!selectedFile && !isGenerateFormOpen && (
            <div className={styles.actions}>
              <UploadImageButton className={styles.upload} onSelect={handleSelectFile}>
                Upload Photo
              </UploadImageButton>
              <button className={styles.generate} type="button" onClick={openGenerateForm}>
                <span className={styles.buttonIcon}>+</span>
                Generate with AI
              </button>
            </div>
          )}

          {selectedFile && (
            <div className={styles.form}>
              <div className={styles.fileName}>{selectedFile.name}</div>

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
                  <span className={styles.backIcon}>←</span>
                  Back
                </button>
                <button className={styles.submitButton} type="button" onClick={handleUploadSubmit}>
                  {isUploading ? "Uploading..." : "Save photo"}
                </button>
              </div>
            </div>
          )}

          {isGenerateFormOpen && (
            <div className={styles.form}>
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
                  <span className={styles.backIcon}>←</span>
                  Back
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
        </div>
      )}
    </div>
  )
}
