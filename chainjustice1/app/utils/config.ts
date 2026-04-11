import "server-only";

import { PinataSDK } from "pinata";

function requiredEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`${name} is required`);
	}

	return value;
}

const pinataJwt = requiredEnv("PINATA_JWT", process.env.PINATA_JWT);
const pinataGateway = requiredEnv("NEXT_PUBLIC_GATEWAY_URL", process.env.NEXT_PUBLIC_GATEWAY_URL);

export const pinata = new PinataSDK({
	pinataJwt,
	pinataGateway,
});
