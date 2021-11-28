use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod auction {

    use super::*;
    pub fn create_game_state(ctx: Context<CreateGameState>, bump: u8) -> ProgramResult {
        // I'm assuming these are set by default
        ctx.accounts.game_account.bump = bump;
        ctx.accounts.game_account.bid_lamports = 0;
        ctx.accounts.game_account.owner = None;

        Ok(())
    }

    pub fn bid(ctx: Context<DoGameBid>, bid: u64) -> ProgramResult {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.from.key(),
            &ctx.accounts.game_account.key(),
            bid,
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.from.to_account_info(),
                ctx.accounts.game_account.to_account_info(),
            ],
        )?;

        ctx.accounts.game_account.bid_lamports = bid;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateGameState<'info> {
    #[account(init, payer=user,
      space=GameState::space(),
      seeds=[],
      bump=bump)]
    pub game_account: Account<'info, GameState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bid: u64)]
pub struct DoGameBid<'info> {
    #[account(mut, seeds = [], bump = game_account.bump)]
    game_account: Account<'info, GameState>,

    #[account(mut)]
    from: Signer<'info>,

    system_program: Program<'info, System>,
}

#[account]
pub struct GameState {
    pub bump: u8,
    owner: Option<Pubkey>,
    bid_lamports: u64,
}

impl GameState {
    fn space() -> usize {
        // discriminator
        8 +
        // bump
        1 +
        // PubKey
        32 +
        // bid_lamports
        1
    }
}
