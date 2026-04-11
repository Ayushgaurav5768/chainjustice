import "server-only";

import { PinataSDK } from "pinata";

function optionalEnv(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

const pinataJwt = optionalEnv(process.env.PINATA_JWT);
const pinataGateway = optionalEnv(process.env.NEXT_PUBLIC_GATEWAY_URL);

export const pinata =
	pinataJwt && pinataGateway
		? new PinataSDK({
			pinataJwt,
			pinataGateway,
		})
		: null;
