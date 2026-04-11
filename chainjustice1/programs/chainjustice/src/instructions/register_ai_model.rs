use anchor_lang::prelude::*;
use crate::errors::ChainJusticeError;
use crate::state::{AiModel, MODEL_NAME_MAX, MODEL_DESCRIPTION_MAX, AIMODEL_SIZE};

pub const MIN_INSURANCE_DEPOSIT: u64 = 1_000_000; // 0.001 SOL in lamports
pub const INITIAL_TRUST_SCORE: u64 = 100;

#[derive(Accounts)]
pub struct RegisterAiModel<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + AIMODEL_SIZE,
        seeds = [b"ai_model", authority.key().as_ref()],
        bump
    )]
    pub ai_model: Account<'info, AiModel>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterAiModel>,
    name: String,
    description: String,
    insurance_deposit: u64,
) -> Result<()> {
    // Validate name
    if name.is_empty() || name.len() > MODEL_NAME_MAX {
        return Err(ChainJusticeError::InvalidModelName.into());
    }

    // Validate description
    if description.is_empty() || description.len() > MODEL_DESCRIPTION_MAX {
        return Err(ChainJusticeError::InvalidDescription.into());
    }

    // Validate minimum deposit
    if insurance_deposit < MIN_INSURANCE_DEPOSIT {
        return Err(ChainJusticeError::InsufficientDeposit.into());
    }

    let ai_model = &mut ctx.accounts.ai_model;
    ai_model.owner = ctx.accounts.authority.key();
    ai_model.name = name;
    ai_model.description = description;
    ai_model.insurance_deposit = insurance_deposit;
    ai_model.trust_score = INITIAL_TRUST_SCORE;
    ai_model.violation_count = 0;
    ai_model.created_at = Clock::get()?.unix_timestamp;
    ai_model.bump = ctx.bumps.ai_model;

    Ok(())
}
