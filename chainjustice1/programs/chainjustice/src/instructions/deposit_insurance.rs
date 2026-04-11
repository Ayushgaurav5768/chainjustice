use anchor_lang::prelude::*;

use crate::errors::ChainJusticeError;
use crate::state::AiModel;

#[derive(Accounts)]
pub struct DepositInsurance<'info> {
	#[account(mut)]
	pub authority: Signer<'info>,

	#[account(
		mut,
		seeds = [b"ai_model", authority.key().as_ref()],
		bump = ai_model.bump,
		constraint = ai_model.owner == authority.key() @ ChainJusticeError::Unauthorized
	)]
	pub ai_model: Account<'info, AiModel>,
}

pub fn handler(ctx: Context<DepositInsurance>, amount: u64) -> Result<()> {
	if amount == 0 {
		return Err(ChainJusticeError::InsufficientDeposit.into());
	}

	let ai_model = &mut ctx.accounts.ai_model;
	ai_model.insurance_deposit = ai_model
		.insurance_deposit
		.checked_add(amount)
		.ok_or(ChainJusticeError::MathOverflow)?;

	Ok(())
}
