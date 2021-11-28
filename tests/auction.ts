import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Auction } from "../target/types/auction";

async function createUser(provider) {
  // 2nd num = lamports per SOL (roughly)
  const airdropBalance = 10 * 1_000_000_000;
  let user = anchor.web3.Keypair.generate();
  let sig = await provider.connection.requestAirdrop(
    user.publicKey,
    airdropBalance
  );
  await provider.connection.confirmTransaction(sig);

  let wallet = new anchor.Wallet(user);
  let userProvider = new anchor.Provider(
    provider.connection,
    wallet,
    provider.opts
  );

  return {
    key: user,
    wallet,
    provider: userProvider,
  };
}

describe("auction", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Auction as Program<Auction>;

  it("Can create game state", async () => {
    const admin = await createUser(provider);

    const bidder1 = await createUser(provider);
    const bidder2 = anchor.web3.Keypair.generate();

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
      signers: [admin.key],
    });

    let fetchedGameAccount = await program.account.gameState.fetch(gameAccount);
    assert.ok(fetchedGameAccount.bidLamports.toString() === "0");

    await program.rpc.bid(new anchor.BN("500"), {
      accounts: {
        gameAccount: gameAccount,
        from: bidder1.key.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [bidder1.key],
    });

    fetchedGameAccount = await program.account.gameState.fetch(gameAccount);
    assert.ok(fetchedGameAccount.bidLamports.toString() === "500");
  });
});
