import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return NextResponse.json({ error: 'IPFS service not configured' }, { status: 500 });
    }

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

    const pinataOptions = JSON.stringify({ cidVersion: 1 });
    pinataFormData.append('pinataOptions', pinataOptions);

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pinataJwt}` },
      body: pinataFormData,
    });

    if (!pinataResponse.ok) {
      const errorData = await pinataResponse.text();
      throw new Error(`Pinata upload failed: ${errorData}`);
    }

    const pinataResult = await pinataResponse.json();
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud';

    return NextResponse.json({
      success: true,
      ipfsHash: pinataResult.IpfsHash,
      pinSize: pinataResult.PinSize,
      timestamp: pinataResult.Timestamp,
      url: `${gatewayUrl}/ipfs/${pinataResult.IpfsHash}`,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    console.error('IPFS Upload Error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}