use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod auction {

    use super::*;
    pub fn create_game_state(ctx: Context<CreateGameState>, bump: u8) -> ProgramResult {
        ctx.accounts.game_account.bump = bump;

        // I'm assuming these are set by default
        ctx.accounts.game_account.owner = Pubkey::default();
        ctx.accounts.game_account.bid_lamports = 0;

        Ok(())
    }

    pub fn bid(ctx: Context<DoGameBid>, bid: u64) -> ProgramResult {
        if bid <= ctx.accounts.game_account.bid_lamports {
            return Err(ErrorCode::BidTooSmall.into());
        }
        ctx.accounts.game_account.bid_lamports = bid;
        ctx.accounts.game_account.owner = ctx.accounts.from.key();

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

        Ok(())
    }

    pub fn set_color(ctx: Context<SetColor>, color: u8) -> ProgramResult {
        if ctx.accounts.from.key() != ctx.accounts.game_account.owner.key() {
            return Err(ErrorCode::NotOwner.into());
        }
        ctx.accounts.game_account.pixel_color = color;
        Ok(())
    }
}

#[error]
pub enum ErrorCode {
    #[msg("Bid too small")]
    BidTooSmall,
    #[msg("Not owner")]
    NotOwner,
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
    bid_lamports: u64,
    owner: Pubkey,
    pub bump: u8,
    pixel_color: u8,
}

// We could also just sign the pub key
#[derive(Accounts)]
#[instruction(color: u8)]
pub struct SetColor<'info> {
    #[account(mut, seeds = [], bump = game_account.bump)]
    game_account: Account<'info, GameState>,

    #[account(mut)]
    from: Signer<'info>,

    //system_program: Program<'info, System>,
}

impl GameState {
    fn space() -> usize {
        // discriminator
        8 +
        // bid_lamports
        8 + 
        // PubKey
        32 +
        // bump
        1 +
        // pixel_color
        1
    }
}
