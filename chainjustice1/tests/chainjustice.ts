import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Chainjustice } from "../target/types/chainjustice";

describe("chainjustice", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.Chainjustice as Program<Chainjustice>;

  it("initializes the registry PDA", async () => {
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

    const tx = await program.methods
      .initializeRegistry()
      .accounts({
        authority: provider.wallet.publicKey,
        registry: registryPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const registry = await program.account.registry.fetch(registryPda);

    console.log("initializeRegistry tx", tx);
    console.log("registry authority", registry.authority.toBase58());
  });
});
