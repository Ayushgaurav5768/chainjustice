use anchor_lang::prelude::*;
use crate::errors::ChainJusticeError;
use crate::state::{Juror, Verdict};

pub const MIN_JUROR_STAKE: u64 = 500_000; // 0.0005 SOL in lamports

#[derive(Accounts)]
#[instruction(stake_amount: u64)]
pub struct StakeAsJuror<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"juror", authority.key().as_ref()],
        bump
    )]
    pub juror: Account<'info, Juror>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<StakeAsJuror>,
    stake_amount: u64,
) -> Result<()> {
    // Validate minimum stake
    if stake_amount < MIN_JUROR_STAKE {
        return Err(ChainJusticeError::InsufficientDeposit.into());
    }

    let juror = &mut ctx.accounts.juror;
    let clock = Clock::get()?;

    juror.authority = ctx.accounts.authority.key();
    juror.case_account = Pubkey::default(); // No case assigned yet
    juror.votes_for_plaintiff = 0;
    juror.votes_for_defendant = 0;
    juror.joined_at = clock.unix_timestamp;
    juror.verdict = Verdict::Pending;
    juror.bump = ctx.bumps.juror;

    Ok(())
}
