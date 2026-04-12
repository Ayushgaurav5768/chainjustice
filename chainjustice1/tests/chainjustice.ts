import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { describe, it } from "mocha";
import { Chainjustice } from "../target/types/chainjustice";

describe("chainjustice", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.Chainjustice as Program<Chainjustice>;
  const authority = provider.wallet.publicKey;

  const toU64Le = (value: anchor.BN): Buffer => {
    const seed = Buffer.alloc(8);
    seed.writeBigUInt64LE(BigInt(value.toString()));
    return seed;
  };

  const toU16Le = (value: number): Buffer => {
    const seed = Buffer.alloc(2);
    seed.writeUInt16LE(value);
    return seed;
  };

  it("initializes registry with correct authority", async () => {
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

    const existing = await program.account.registry.fetchNullable(registryPda);
    if (!existing) {
      await program.methods
        .initializeRegistry()
        .accounts({
          authority,
          registry: registryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();
    }

    const registry = await program.account.registry.fetch(registryPda);
    expect(registry.authority.toBase58()).to.equal(authority.toBase58());
    expect(registry.nextCaseId.toNumber()).to.be.greaterThan(0);
  });

  it("runs deterministic local case flow with assertions", async () => {
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );
    const [aiModelPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ai_model"), authority.toBuffer()],
      program.programId
    );
    const [jurorProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("juror_profile"), authority.toBuffer()],
      program.programId
    );

    const initialRegistry = await program.account.registry.fetch(registryPda);
    const caseId = new anchor.BN(initialRegistry.nextCaseId.toString());

    const [caseRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("case_record"), toU64Le(caseId)],
      program.programId
    );
    const [evidenceRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("evidence_record"), caseRecordPda.toBuffer(), toU16Le(0)],
      program.programId
    );
    const [aiDecisionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ai_decision"), caseRecordPda.toBuffer()],
      program.programId
    );
    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote_record"), caseRecordPda.toBuffer(), authority.toBuffer()],
      program.programId
    );

    await program.methods
      .registerAiModel("family-main", "Model One", "ipfs://model-metadata", new anchor.BN(500_000))
      .accounts({
        provider: authority,
        aiModel: aiModelPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const model = await program.account.aiModelProfile.fetch(aiModelPda);
    expect(model.provider.toBase58()).to.equal(authority.toBase58());
    expect(model.modelFamily).to.equal("family-main");
    expect(model.modelName).to.equal("Model One");
    expect(model.insurancePoolLamports.toNumber()).to.equal(500000);
    expect(model.isActive).to.equal(true);

    await program.methods
      .fileCase(
        caseId,
        "Model accountability complaint",
        "Complainant alleges harmful behavior with evidence for juror review.",
        1,
        new anchor.BN(300),
        authority,
        Array(32).fill(0)
      )
      .accounts({
        complainant: authority,
        registry: registryPda,
        aiModel: aiModelPda,
        caseRecord: caseRecordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const caseRecord = await program.account.caseRecord.fetch(caseRecordPda);
    expect(caseRecord.caseId.toNumber()).to.equal(caseId.toNumber());
    expect(caseRecord.complainant.toBase58()).to.equal(authority.toBase58());
    expect(caseRecord.defendantModel.toBase58()).to.equal(aiModelPda.toBase58());
    expect(caseRecord.requiredJurors).to.equal(1);
    expect(caseRecord.evidenceCount).to.equal(0);

    const registryAfterCase = await program.account.registry.fetch(registryPda);
    expect(registryAfterCase.nextCaseId.toNumber()).to.equal(caseId.toNumber() + 1);

    await program.methods
      .submitEvidence(
        0,
        "bafybeigdyrj6rj2za4kfjz7v6uz6wkq5xisamplecid12345",
        "application/pdf",
        "Primary incident artifact"
      )
      .accounts({
        submitter: authority,
        caseRecord: caseRecordPda,
        evidenceRecord: evidenceRecordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const evidence = await program.account.evidenceRecord.fetch(evidenceRecordPda);
    expect(evidence.case.toBase58()).to.equal(caseRecordPda.toBase58());
    expect(evidence.mimeType).to.equal("application/pdf");

    const caseAfterEvidence = await program.account.caseRecord.fetch(caseRecordPda);
    expect(caseAfterEvidence.evidenceCount).to.equal(1);

    await program.methods
      .stakeAsJuror(new anchor.BN(1_000_000))
      .accounts({
        juror: authority,
        jurorProfile: jurorProfilePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const juror = await program.account.jurorProfile.fetch(jurorProfilePda);
    expect(juror.authority.toBase58()).to.equal(authority.toBase58());
    expect(juror.stakeLamports.toNumber()).to.equal(1000000);

    await program.methods
      .selectJurors([authority])
      .accounts({
        selector: authority,
        registry: registryPda,
        authority,
        caseRecord: caseRecordPda,
      } as any)
      .rpc();

    await program.methods
      .submitAiAnalysis(
        "ipfs://ai-analysis",
        Array(32).fill(1),
        authority,
        Array(32).fill(2)
      )
      .accounts({
        submitter: authority,
        caseRecord: caseRecordPda,
        aiDecisionMetadata: aiDecisionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    await program.methods
      .castVote({ plaintiff: {} }, Array(32).fill(3))
      .accounts({
        voter: authority,
        caseRecord: caseRecordPda,
        jurorProfile: jurorProfilePda,
        voteRecord: voteRecordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const vote = await program.account.voteRecord.fetch(voteRecordPda);
    expect(vote.case.toBase58()).to.equal(caseRecordPda.toBase58());
    expect(vote.juror.toBase58()).to.equal(authority.toBase58());

    const caseAfterVote = await program.account.caseRecord.fetch(caseRecordPda);
    expect(caseAfterVote.votesForPlaintiff).to.equal(1);
    expect(caseAfterVote.votesForDefendant).to.equal(0);
  });
});
