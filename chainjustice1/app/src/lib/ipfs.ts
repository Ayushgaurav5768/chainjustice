export type IpfsUploadSuccess = {
  success: true
  fallbackMode: boolean
  source: "pinata" | "mock"
  data: {
    cid: string
    url: string
    filename: string
    mimeType: string
    size: number
    // Backward-compatible fields maintained by the API.
    ipfsHash: string
    gatewayUrl: string
    originalFilename: string
    uploadedAt: string
  }
}

export type IpfsUploadError = {
  success: false
  error: {
    code:
      | "BAD_REQUEST"
      | "INVALID_CONTENT_TYPE"
      | "MISSING_FILE"
      | "INVALID_FILE_TYPE"
      | "FILE_TOO_LARGE"
      | "AI_PROVIDER_ERROR"
      | "PINATA_UPLOAD_FAILED"
      | "INTERNAL_ERROR"
    message: string
    details?: Record<string, unknown>
  }
}

export type IpfsUploadResponse = IpfsUploadSuccess | IpfsUploadError

const asUploadError = (fallbackMessage: string, payload?: unknown): Error => {
  if (payload && typeof payload === "object") {
    const maybe = payload as Partial<IpfsUploadError>
    const message = maybe.error?.message || fallbackMessage
    const code = maybe.error?.code
    return new Error(code ? `${code}: ${message}` : message)
  }

  return new Error(fallbackMessage)
}

export const uploadEvidenceFile = async (file: File): Promise<IpfsUploadSuccess> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/ipfs", {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json().catch(() => null)) as IpfsUploadResponse | null

  if (!response.ok || !payload || payload.success === false) {
    throw asUploadError("File upload failed", payload)
  }

  return payload
}
