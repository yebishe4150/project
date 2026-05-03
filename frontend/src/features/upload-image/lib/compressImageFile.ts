import imageCompression from "browser-image-compression"

const COMPRESSION_OPTIONS = {
  maxSizeMB: 3,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
}

export async function compressImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return file
  }

  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS)

    if (compressedFile.size >= file.size) {
      return file
    }

    return new File([compressedFile], file.name, {
      type: compressedFile.type || file.type,
      lastModified: file.lastModified,
    })
  } catch {
    return file
  }
}
