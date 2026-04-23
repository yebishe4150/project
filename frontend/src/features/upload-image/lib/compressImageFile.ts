import imageCompression from "browser-image-compression"

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
}

export async function compressImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return file
  }

  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS)

    return compressedFile.size < file.size ? compressedFile : file
  } catch {
    return file
  }
}
