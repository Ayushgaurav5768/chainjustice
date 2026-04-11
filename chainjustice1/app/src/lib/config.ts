import { clusterApiUrl } from "@solana/web3.js"
import { DEFAULT_GATEWAY_URL, DEFAULT_SOLANA_NETWORK } from "@/lib/constants"

const getEnv = (name: string): string | undefined => {
  const value = process.env[name]
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const appConfig = {
  googleApiKey: getEnv("GOOGLE_API_KEY") || getEnv("GEMINI_API_KEY"),
  pinataApiKey: getEnv("PINATA_API_KEY"),
  pinataSecret: getEnv("PINATA_SECRET"),
  pinataJwt: getEnv("PINATA_JWT"),
  solanaNetwork: getEnv("NEXT_PUBLIC_SOLANA_NETWORK") || DEFAULT_SOLANA_NETWORK,
  solanaRpcUrl: getEnv("NEXT_PUBLIC_SOLANA_RPC_URL"),
  gatewayUrl: getEnv("NEXT_PUBLIC_GATEWAY_URL") || DEFAULT_GATEWAY_URL,
  chainjusticeProgramId:
    getEnv("NEXT_PUBLIC_CHAINJUSTICE_PROGRAM_ID") ||
    getEnv("NEXT_PUBLIC_PROGRAM_ID") ||
    "G6UN14ZNB6TpXgohEzmaXBGmfwzpmgRPi4w7p4p39woC",
}

export const isDevFallbackMode = (): boolean =>
  !appConfig.googleApiKey || (!appConfig.pinataJwt && !(appConfig.pinataApiKey && appConfig.pinataSecret))

export const resolveRpcEndpoint = (): string => {
  if (appConfig.solanaRpcUrl) return appConfig.solanaRpcUrl
  if (appConfig.solanaNetwork === "mainnet-beta") return clusterApiUrl("mainnet-beta")
  if (appConfig.solanaNetwork === "testnet") return clusterApiUrl("testnet")
  return clusterApiUrl("devnet")
}
