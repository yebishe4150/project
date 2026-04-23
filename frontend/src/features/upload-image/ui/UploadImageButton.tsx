import { useRef } from "react"
import type { ChangeEvent, ReactNode } from "react"
import { compressImageFile } from "../lib/compressImageFile"

type Props = {
  children?: ReactNode
  className?: string
  onSelect: (file: File) => void
}

export const UploadImageButton = ({
  children = "Add first photo",
  className,
  onSelect,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    const compressedFile = await compressImageFile(file)

    onSelect(compressedFile)
    event.target.value = ""
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleChange} />
      <button className={className} type="button" onClick={() => inputRef.current?.click()}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
          <path
            d="M12 16V4m0 0L7 9m5-5l5 5M5 16v3h14v-3"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        {children}
      </button>
    </>
  )
}
