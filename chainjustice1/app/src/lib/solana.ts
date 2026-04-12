import {
  AnchorProvider,
  BN,
  Idl,
  Program,
  web3,
} from "@coral-xyz/anchor"
import { Connection, PublicKey, TransactionSignature } from "@solana/web3.js"
import { appConfig, resolveRpcEndpoint } from "@/lib/config"
import { mockVerdictLedger } from "@/lib/mock-data"
import type { VerdictLedgerEntry } from "@/types"

export const CHAINJUSTICE_NETWORK = appConfig.solanaNetwork
export const HAS_CHAINJUSTICE_IDL = false

const DEFAULT_PROGRAM_ID = "G6UN14ZNB6TpXgohEzmaXBGmfwzpmgRPi4w7p4p39woC"

const resolveProgramId = (): PublicKey => {
  try {
    return new PublicKey(appConfig.chainjusticeProgramId)
  } catch {
    return new PublicKey(DEFAULT_PROGRAM_ID)
  }
}

type AnchorWalletLike = {
  publicKey: PublicKey
  signTransaction: AnchorProvider["wallet"]["signTransaction"]
  signAllTransactions: AnchorProvider["wallet"]["signAllTransactions"]
}

type WalletInput = {
  publicKey: PublicKey
  signTransaction: AnchorProvider["wallet"]["signTransaction"]
  signAllTransactions?: AnchorProvider["wallet"]["signAllTransactions"]
}

type ProgramFetchOptions = {
  connection?: Connection
  wallet?: WalletInput
  idl?: Idl
}

type ProgramContext = {
  program: Program<Idl> | null
  provider: AnchorProvider
  source: "anchor" | "mock"
}

type RpcBuilder = {
  accounts: (accounts: Record<string, unknown>) => {
    rpc: () => Promise<TransactionSignature>
  }
}

type MethodsLike = {
  registerAiModel: (...args: unknown[]) => RpcBuilder
  fileCase: (...args: unknown[]) => RpcBuilder
  submitEvidence: (...args: unknown[]) => RpcBuilder
  stakeAsJuror: (...args: unknown[]) => RpcBuilder
  castVote: (...args: unknown[]) => RpcBuilder
  enforceVerdict: (...args: unknown[]) => RpcBuilder
  depositInsurance: (...args: unknown[]) => RpcBuilder
}

type VerdictLedgerAccount = {
  account: OnChainLedgerLike
}

type ProgramLike = Program<Idl> & {
  methods: MethodsLike
  account: {
    verdictLedger: {
      all: () => Promise<VerdictLedgerAccount[]>
    }
  }
}

const asProgramLike = (program: Program<Idl>): ProgramLike =>
  program as unknown as ProgramLike

export type ClientResult<T> = {
  success: boolean
  source: "anchor" | "mock"
  signature?: TransactionSignature
  data: T
  message?: string
}

export type RegisterModelInput = {
  modelFamily: string
  modelName: string
  metadataUri: string
  initialDepositLamports?: number
}

export type FileCaseInput = {
  caseId: bigint | number
  title: string
  summary: string
  requiredJurors: number
  votingWindowSeconds: number
  excludedProviderForAi?: PublicKey
  excludedModelFamilyHashForAi?: number[]
}

export type SubmitEvidenceInput = {
  caseId: bigint | number
  evidenceIndex: number
  evidenceCid: string
  mimeType: string
  description: string
}

export type CastVoteInput = {
  caseId: bigint | number
  side: "plaintiff" | "defendant"
  reasonHash?: number[]
}

export type EnforceVerdictInput = {
  caseId: bigint | number
  complainant: PublicKey
  aiModel?: PublicKey
}

export type DepositInsuranceInput = {
  modelProvider: PublicKey
  amountLamports: number
}

export const CHAINJUSTICE_PROGRAM_ID = resolveProgramId()

export const getRpcEndpoint = (): string => resolveRpcEndpoint()

export const createConnection = (): Connection =>
  new Connection(getRpcEndpoint(), "confirmed")

const toHumanReadableError = (action: string, error: unknown): string => {
  if (error instanceof Error && error.message) {
    return `${action} failed: ${error.message}`
  }
  return `${action} failed due to an unexpected wallet or network error`
}

const requireWallet = (wallet: ProgramFetchOptions["wallet"], action: string): WalletInput => {
  if (!wallet) {
    throw new Error(
      `${action} requires a connected wallet. Connect Phantom, Solflare, or another Wallet Standard wallet and try again.`
    )
  }

  return wallet
}

const createReadonlyWallet = (): AnchorWalletLike => ({
  publicKey: PublicKey.default,
  signTransaction: async (tx) => tx,
  signAllTransactions: async (txs) => txs,
})

const toAnchorWallet = (
  wallet?: ProgramFetchOptions["wallet"]
): AnchorWalletLike => {
  const resolved = wallet || createReadonlyWallet()

  return {
    publicKey: resolved.publicKey,
    signTransaction: resolved.signTransaction,
    signAllTransactions: resolved.signAllTransactions || (async (txs) => txs),
  }
}

const createProvider = (
  connection: Connection,
  wallet?: ProgramFetchOptions["wallet"]
): AnchorProvider =>
  new AnchorProvider(connection, toAnchorWallet(wallet), {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  })

const toCaseSeed = (caseId: bigint | number): Buffer => {
  const value = typeof caseId === "bigint" ? caseId : BigInt(caseId)
  const seed = Buffer.alloc(8)
  seed.writeBigUInt64LE(value)
  return seed
}

const toU16Seed = (value: number): Buffer => {
  const seed = Buffer.alloc(2)
  seed.writeUInt16LE(value)
  return seed
}

const toHash32 = (values?: number[]): number[] => {
  const output = new Array(32).fill(0)
  if (!values?.length) return output
  for (let i = 0; i < Math.min(32, values.length); i += 1) {
    output[i] = values[i] ?? 0
  }
  return output
}

export const getProgram = (
  options: ProgramFetchOptions = {}
): ProgramContext => {
  const connection = options.connection || createConnection()
  const provider = createProvider(connection, options.wallet)

  if (!options.idl) {
    return {
      program: null,
      provider,
      source: "mock",
    }
  }

  const program = new Program(options.idl, provider)
  return {
    program,
    provider,
    source: "anchor",
  }
}

export const initializeProgram = (
  options: ProgramFetchOptions = {}
): ProgramContext => getProgram(options)

export const getRegistryPda = (): [PublicKey, number] =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    CHAINJUSTICE_PROGRAM_ID
  )

export const getAiModelPda = (authority: PublicKey): [PublicKey, number] =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("ai_model"), authority.toBuffer()],
    CHAINJUSTICE_PROGRAM_ID
  )

export const getCaseRecordPda = (caseId: bigint | number): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("case_record"), toCaseSeed(caseId)],
    CHAINJUSTICE_PROGRAM_ID
  )
}

export const getEvidenceRecordPda = (
  caseRecord: PublicKey,
  evidenceIndex: number
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("evidence_record"), caseRecord.toBuffer(), toU16Seed(evidenceIndex)],
    CHAINJUSTICE_PROGRAM_ID
  )
}

export const getJurorProfilePda = (
  jurorAuthority: PublicKey
): [PublicKey, number] =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("juror_profile"), jurorAuthority.toBuffer()],
    CHAINJUSTICE_PROGRAM_ID
  )

export const getVoteRecordPda = (
  caseRecord: PublicKey,
  jurorAuthority: PublicKey
): [PublicKey, number] =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("vote_record"), caseRecord.toBuffer(), jurorAuthority.toBuffer()],
    CHAINJUSTICE_PROGRAM_ID
  )

export const getAiDecisionPda = (caseRecord: PublicKey): [PublicKey, number] =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("ai_decision"), caseRecord.toBuffer()],
    CHAINJUSTICE_PROGRAM_ID
  )

export const getVerdictLedgerPda = (caseRecord: PublicKey): [PublicKey, number] =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("verdict_ledger"), caseRecord.toBuffer()],
    CHAINJUSTICE_PROGRAM_ID
  )

export const getCourtCasePda = (caseId: bigint | number): [PublicKey, number] =>
  getCaseRecordPda(caseId)

export const getJurorPda = (jurorAuthority: PublicKey): [PublicKey, number] =>
  getJurorProfilePda(jurorAuthority)

export const registerModel = async (
  input: RegisterModelInput,
  options: ProgramFetchOptions = {}
): Promise<ClientResult<{ model: PublicKey }>> => {
  const ctx = getProgram(options)
  const wallet = requireWallet(options.wallet, "registerModel")

  const [model] = getAiModelPda(wallet.publicKey)

  if (!ctx.program) {
    return {
      success: true,
      source: "mock",
      data: { model },
    }
  }

  const program = asProgramLike(ctx.program)

  try {
    const signature = await program.methods
      .registerAiModel(
        input.modelFamily,
        input.modelName,
        input.metadataUri,
        new BN(input.initialDepositLamports || 0)
      )
      .accounts({
        provider: wallet.publicKey,
        aiModel: model,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()

    return {
      success: true,
      source: "anchor",
      signature,
      data: { model },
    }
  } catch (error) {
    return {
      success: false,
      source: "mock",
      data: { model },
      message: toHumanReadableError("registerModel", error),
    }
  }
}

export const fileCase = async (
  input: FileCaseInput,
  options: ProgramFetchOptions = {}
): Promise<ClientResult<{ caseRecord: PublicKey }>> => {
  const ctx = getProgram(options)
  const wallet = requireWallet(options.wallet, "fileCase")

  const [registry] = getRegistryPda()
  const [caseRecord] = getCaseRecordPda(input.caseId)
  const [aiModel] = getAiModelPda(input.excludedProviderForAi || wallet.publicKey)

  if (!ctx.program) {
    return {
      success: true,
      source: "mock",
      data: { caseRecord },
    }
  }

  const program = asProgramLike(ctx.program)

  try {
    const signature = await program.methods
      .fileCase(
        new BN(typeof input.caseId === "bigint" ? input.caseId.toString() : input.caseId),
        input.title,
        input.summary,
        input.requiredJurors,
        new BN(input.votingWindowSeconds),
        input.excludedProviderForAi || wallet.publicKey,
        toHash32(input.excludedModelFamilyHashForAi)
      )
      .accounts({
        complainant: wallet.publicKey,
        registry,
        aiModel,
        caseRecord,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()

    return {
      success: true,
      source: "anchor",
      signature,
      data: { caseRecord },
    }
  } catch (error) {
    return {
      success: false,
      source: "mock",
      data: { caseRecord },
      message: toHumanReadableError("fileCase", error),
    }
  }
}

export const submitEvidence = async (
  input: SubmitEvidenceInput,
  options: ProgramFetchOptions = {}
): Promise<ClientResult<{ evidenceRecord: PublicKey }>> => {
  const ctx = getProgram(options)
  const wallet = requireWallet(options.wallet, "submitEvidence")

  const [caseRecord] = getCaseRecordPda(input.caseId)
  const [evidenceRecord] = getEvidenceRecordPda(caseRecord, input.evidenceIndex)

  if (!ctx.program) {
    return {
      success: true,
      source: "mock",
      data: { evidenceRecord },
    }
  }

  const program = asProgramLike(ctx.program)

  try {
    const signature = await program.methods
      .submitEvidence(
        input.evidenceIndex,
        input.evidenceCid,
        input.mimeType,
        input.description
      )
      .accounts({
        submitter: wallet.publicKey,
        caseRecord,
        evidenceRecord,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()

    return {
      success: true,
      source: "anchor",
      signature,
      data: { evidenceRecord },
    }
  } catch (error) {
    return {
      success: false,
      source: "mock",
      data: { evidenceRecord },
      message: toHumanReadableError("submitEvidence", error),
    }
  }
}

export const stakeAsJuror = async (
  amountLamports: number,
  options: ProgramFetchOptions = {}
): Promise<ClientResult<{ jurorProfile: PublicKey }>> => {
  const ctx = getProgram(options)
  const wallet = requireWallet(options.wallet, "stakeAsJuror")

  const [jurorProfile] = getJurorProfilePda(wallet.publicKey)

  if (!ctx.program) {
    return {
      success: true,
      source: "mock",
      data: { jurorProfile },
    }
  }

  const program = asProgramLike(ctx.program)

  try {
    const signature = await program.methods
      .stakeAsJuror(new BN(amountLamports))
      .accounts({
        juror: wallet.publicKey,
        jurorProfile,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()

    return {
      success: true,
      source: "anchor",
      signature,
      data: { jurorProfile },
    }
  } catch (error) {
    return {
      success: false,
      source: "mock",
      data: { jurorProfile },
      message: toHumanReadableError("stakeAsJuror", error),
    }
  }
}

export const castVote = async (
  input: CastVoteInput,
  options: ProgramFetchOptions = {}
): Promise<ClientResult<{ voteRecord: PublicKey }>> => {
  const ctx = getProgram(options)
  const wallet = requireWallet(options.wallet, "castVote")

  const [caseRecord] = getCaseRecordPda(input.caseId)
  const [jurorProfile] = getJurorProfilePda(wallet.publicKey)
  const [voteRecord] = getVoteRecordPda(caseRecord, wallet.publicKey)

  if (!ctx.program) {
    return {
      success: true,
      source: "mock",
      data: { voteRecord },
    }
  }

  const side = input.side === "plaintiff" ? { plaintiff: {} } : { defendant: {} }
  const program = asProgramLike(ctx.program)

  try {
    const signature = await program.methods
      .castVote(side, toHash32(input.reasonHash))
      .accounts({
        voter: wallet.publicKey,
        caseRecord,
        jurorProfile,
        voteRecord,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()

    return {
      success: true,
      source: "anchor",
      signature,
      data: { voteRecord },
    }
  } catch (error) {
    return {
      success: false,
      source: "mock",
      data: { voteRecord },
      message: toHumanReadableError("castVote", error),
    }
  }
}

export const enforceVerdict = async (
  input: EnforceVerdictInput,
  options: ProgramFetchOptions = {}
): Promise<ClientResult<{ verdictLedger: PublicKey }>> => {
  const ctx = getProgram(options)
  const wallet = requireWallet(options.wallet, "enforceVerdict")

  const [caseRecord] = getCaseRecordPda(input.caseId)
  const [aiDecision] = getAiDecisionPda(caseRecord)
  const [verdictLedger] = getVerdictLedgerPda(caseRecord)

  const aiModel = input.aiModel || wallet.publicKey

  if (!ctx.program) {
    return {
      success: true,
      source: "mock",
      data: { verdictLedger },
    }
  }

  const program = asProgramLike(ctx.program)

  try {
    const signature = await program.methods
      .enforceVerdict()
      .accounts({
        enforcer: wallet.publicKey,
        complainant: input.complainant,
        caseRecord,
        aiModel,
        aiDecisionMetadata: aiDecision,
        verdictLedger,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()

    return {
      success: true,
      source: "anchor",
      signature,
      data: { verdictLedger },
    }
  } catch (error) {
    return {
      success: false,
      source: "mock",
      data: { verdictLedger },
      message: toHumanReadableError("enforceVerdict", error),
    }
  }
}

export const depositInsurance = async (
  input: DepositInsuranceInput,
  options: ProgramFetchOptions = {}
): Promise<ClientResult<{ model: PublicKey }>> => {
  const ctx = getProgram(options)
  const wallet = requireWallet(options.wallet, "depositInsurance")

  const [model] = getAiModelPda(input.modelProvider)

  if (!ctx.program) {
    return {
      success: true,
      source: "mock",
      data: { model },
    }
  }

  const program = asProgramLike(ctx.program)

  try {
    const signature = await program.methods
      .depositInsurance(new BN(input.amountLamports))
      .accounts({
        depositor: wallet.publicKey,
        aiModel: model,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()

    return {
      success: true,
      source: "anchor",
      signature,
      data: { model },
    }
  } catch (error) {
    return {
      success: false,
      source: "mock",
      data: { model },
      message: toHumanReadableError("depositInsurance", error),
    }
  }
}

type OnChainLedgerLike = {
  caseId?: string
  modelName?: string
  modelId?: string
  outcome?: string
  trustBefore?: number
  trustAfter?: number
  trustScoreBefore?: number
  trustScoreAfter?: number
  trustDelta?: number
  insurancePoolBefore?: string | number
  insurancePoolAfter?: string | number
  recordedAt?: string | number
  txSignature?: string
}

const normalizeVerdict = (verdict: string | undefined): VerdictLedgerEntry["verdict"] => {
  if (verdict === "plaintiff") return "plaintiff"
  if (verdict === "defendant") return "defendant"
  return "split"
}

export const transformLedgerEntry = (
  entry: OnChainLedgerLike,
  fallback: VerdictLedgerEntry
): VerdictLedgerEntry => {
  const before =
    entry.trustScoreBefore ?? entry.trustBefore ?? fallback.trustScoreBefore
  const after =
    entry.trustScoreAfter ?? entry.trustAfter ?? fallback.trustScoreAfter

  return {
    entryId: fallback.entryId,
    caseId: entry.caseId || fallback.caseId,
    modelId: entry.modelId || fallback.modelId,
    modelName: entry.modelName || fallback.modelName,
    verdict: normalizeVerdict(entry.outcome) || fallback.verdict,
    trustScoreBefore: Number(before),
    trustScoreAfter: Number(after),
    trustDelta: entry.trustDelta ?? Number(after) - Number(before),
    insurancePoolBefore: String(entry.insurancePoolBefore ?? fallback.insurancePoolBefore),
    insurancePoolAfter: String(entry.insurancePoolAfter ?? fallback.insurancePoolAfter),
    recordedAt:
      typeof entry.recordedAt === "number"
        ? new Date(entry.recordedAt * 1000).toISOString()
        : entry.recordedAt || fallback.recordedAt,
    txSignature: entry.txSignature || fallback.txSignature,
  }
}

export const fetchVerdictLedger = async (
  options: ProgramFetchOptions = {}
): Promise<ClientResult<VerdictLedgerEntry[]>> => {
  const ctx = getProgram(options)

  if (!ctx.program) {
    return {
      success: true,
      source: "mock",
      data: mockVerdictLedger,
    }
  }

  try {
    const program = asProgramLike(ctx.program)
    const accounts = await program.account.verdictLedger.all()
    const merged = accounts.map((item, index: number) =>
      transformLedgerEntry(item.account, mockVerdictLedger[index] || mockVerdictLedger[0])
    )

    return {
      success: true,
      source: "anchor",
      data: merged.length > 0 ? merged : mockVerdictLedger,
    }
  } catch {
    return {
      success: false,
      source: "mock",
      data: mockVerdictLedger,
      message:
        "Could not fetch on-chain verdict ledger. Showing demo fallback data so the UI remains usable.",
    }
  }
}
