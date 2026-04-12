import { NextResponse } from "next/server"

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_CONTENT_TYPE"
  | "MISSING_FILE"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "AI_PROVIDER_ERROR"
  | "PINATA_UPLOAD_FAILED"
  | "INTERNAL_ERROR"

export type ApiErrorPayload = {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    details?: Record<string, unknown>
  }
}

export const apiError = (
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
) =>
  NextResponse.json<ApiErrorPayload>(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  )
