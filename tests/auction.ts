import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Auction } from "../target/types/auction";

async function createUser(provider, sol = 10) {
  // 2nd num = lamports per SOL (roughly)
  const airdropBalance = sol * 1_000_000_000;
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

  it("Everything works", async () => {
    const admin = await createUser(provider, 10);
    const bidder1 = await createUser(provider, 10);
    const bidder2 = await createUser(provider, 10);

    const [gameAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [],
      program.programId
    );

    await program.rpc.createGameState(bump, {
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

    await program.rpc.bid(new anchor.BN("600"), {
      accounts: {
        gameAccount: gameAccount,
        from: bidder2.key.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [bidder2.key],
    });

    fetchedGameAccount = await program.account.gameState.fetch(gameAccount);
    assert.ok(fetchedGameAccount.bidLamports.toString() === "600");

    /*
    {
      // Test re-deriving the PDA (program derived account) with the bump
      const gameAccount2  = await anchor.web3.PublicKey.createProgramAddress(
        //@ts-ignore
        [bump],
        program.programId
      );
    }
    */

    try {
      // A bid that's too small should fail
      await program.rpc.bid(new anchor.BN("100"), {
        accounts: {
          gameAccount: gameAccount,
          from: bidder2.key.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [bidder2.key],
      });
    } catch (e) {
      assert.equal(e.toString(), "Bid too small");
    }

    await program.rpc.setColor(12, {
      accounts: {
        gameAccount: gameAccount,
        from: bidder2.key.publicKey,
      },
      signers: [bidder2.key],
    });

    fetchedGameAccount = await program.account.gameState.fetch(gameAccount);
    assert.ok(fetchedGameAccount.pixelColor.toString() === "12");
  });
});
