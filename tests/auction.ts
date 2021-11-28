import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Auction } from "../target/types/auction";

async function createUser(provider) {
  // 2nd num = lamports per SOL (roughly)
  const airdropBalance =  10 * 1_000_000_000;
  let user = anchor.web3.Keypair.generate();
  let sig = await provider.connection.requestAirdrop(user.publicKey, airdropBalance);
  await provider.connection.confirmTransaction(sig);

  let wallet = new anchor.Wallet(user);
  let userProvider = new anchor.Provider(provider.connection, wallet, provider.opts);

  return {
    key: user,
    wallet,
    provider: userProvider,
  };
}

describe("auction", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.Auction as Program<Auction>;

  it("Can create game state", async () => {
    const admin = await createUser(provider)

    const [gameAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [],
      program.programId
    );

    const tx = await program.rpc.createGameState(bump, {
      accounts: {
        gameAccount: gameAccount,
        user: admin.key.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [admin.key]
    });

  });
});
