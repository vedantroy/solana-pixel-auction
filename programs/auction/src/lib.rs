use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod auction {
    use super::*;
    pub fn create_game_state(ctx: Context<CreateGameState>, bump: u8) -> ProgramResult {
        ctx.accounts.game_account.bump = bump;
        ctx.accounts.game_account.state = 0;
        Ok(())
    }


    pub fn increment_counter(ctx: Context<DoGameVote>) -> ProgramResult {
        ctx.accounts.game_account.state += 1;
        Ok(())
    }

    pub fn decrement_counter(ctx: Context<DoGameVote>) -> ProgramResult {
        ctx.accounts.game_account.state -= 1;
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
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DoGameVote<'info> {
    #[account(mut, seeds = [], bump = game_account.bump)]
    game_account: Account<'info, GameState>,
}

#[account]
pub struct GameState {
    pub bump: u8,
    state: usize,
}

impl GameState {
    fn space() -> usize {
        // discriminator + bump
        8 + 1
    }
}
