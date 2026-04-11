import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/lib/config';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

type UploadErrorCode =
  | 'INVALID_CONTENT_TYPE'
  | 'MISSING_FILE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'PINATA_UPLOAD_FAILED'
  | 'INTERNAL_ERROR';

type UploadErrorPayload = {
  success: false;
  fallbackMode: boolean;
  error: {
    code: UploadErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

type UploadSuccessPayload = {
  success: true;
  fallbackMode: boolean;
  source: 'pinata' | 'mock';
  data: {
    cid: string;
    ipfsHash: string;
    gatewayUrl: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  };
};

const jsonError = (
  status: number,
  code: UploadErrorCode,
  message: string,
  fallbackMode = false,
  details?: Record<string, unknown>
) =>
  NextResponse.json<UploadErrorPayload>(
    {
      success: false,
      fallbackMode,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );

const hasPinataCredentials = (): boolean => {
  const hasJwt = Boolean(appConfig.pinataJwt);
  const hasLegacyKeys = Boolean(appConfig.pinataApiKey && appConfig.pinataSecret);
  return hasJwt || hasLegacyKeys;
};

const buildGatewayUrl = (cid: string): string => `${appConfig.gatewayUrl}/ipfs/${cid}`;

const createMockCid = (): string => {
  const entropy = randomBytes(16).toString('hex');
  return `bafy-demo-${Date.now().toString(36)}-${entropy}`;
};

const inferMimeFromName = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return '';
};

const validateFile = (file: File): { error: UploadErrorPayload['error'] | null; mimeType: string } => {
  if (!file || !(file instanceof File)) {
    return {
      error: {
        code: 'MISSING_FILE',
        message: 'No file provided. Attach a file under the form-data field name "file".',
      },
      mimeType: '',
    };
  }

  const mimeType = file.type || inferMimeFromName(file.name);

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      error: {
        code: 'INVALID_FILE_TYPE',
        message: `Unsupported file type: ${mimeType || 'unknown'}`,
        details: {
          allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
        },
      },
      mimeType,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`,
        details: {
          maxBytes: MAX_FILE_SIZE_BYTES,
          receivedBytes: file.size,
        },
      },
      mimeType,
    };
  }

  return { error: null, mimeType };
};

const pinToIpfs = async (file: File): Promise<{ cid: string; uploadedAt: string }> => {
  const pinataFormData = new FormData();
  pinataFormData.append('file', file);

  const pinataMetadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      app: 'chainjustice',
      uploadedAt: new Date().toISOString(),
    },
  });
  pinataFormData.append('pinataMetadata', pinataMetadata);
  pinataFormData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const headers: HeadersInit = appConfig.pinataJwt
    ? { Authorization: `Bearer ${appConfig.pinataJwt}` }
    : {
        pinata_api_key: appConfig.pinataApiKey || '',
        pinata_secret_api_key: appConfig.pinataSecret || '',
      };

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers,
    body: pinataFormData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || 'Pinata upload request failed');
  }

  const payload = (await response.json()) as {
    IpfsHash?: string;
    Timestamp?: string;
  };

  if (!payload.IpfsHash) {
    throw new Error('Pinata response did not include IpfsHash');
  }

  return {
    cid: payload.IpfsHash,
    uploadedAt: payload.Timestamp || new Date().toISOString(),
  };
};

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return jsonError(
        400,
        'INVALID_CONTENT_TYPE',
        'Content-Type must be multipart/form-data.'
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    const validation = validateFile(file);
    if (validation.error) {
      return jsonError(
        400,
        validation.error.code,
        validation.error.message,
        false,
        validation.error.details
      );
    }
    const mimeType = validation.mimeType;

    if (!hasPinataCredentials()) {
      const cid = createMockCid();
      return NextResponse.json<UploadSuccessPayload>({
        success: true,
        fallbackMode: true,
        source: 'mock',
        data: {
          cid,
          ipfsHash: cid,
          gatewayUrl: buildGatewayUrl(cid),
          originalFilename: file.name,
          mimeType,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    let pinResult: { cid: string; uploadedAt: string };
    try {
      pinResult = await pinToIpfs(file);
    } catch (error) {
      return jsonError(
        502,
        'PINATA_UPLOAD_FAILED',
        'Upload provider failed to pin the file.',
        true,
        {
          reason: error instanceof Error ? error.message : 'Unknown pinning error',
        }
      );
    }

    return NextResponse.json<UploadSuccessPayload>({
      success: true,
      fallbackMode: false,
      source: 'pinata',
      data: {
        cid: pinResult.cid,
        ipfsHash: pinResult.cid,
        gatewayUrl: buildGatewayUrl(pinResult.cid),
        originalFilename: file.name,
        mimeType,
        size: file.size,
        uploadedAt: pinResult.uploadedAt,
      },
    });

  } catch (error: unknown) {
    console.error('IPFS Upload Error:', error);
    return jsonError(
      500,
      'INTERNAL_ERROR',
      'Unexpected upload error occurred.',
      false,
      {
        reason: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }
}