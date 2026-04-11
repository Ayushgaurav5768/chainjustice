use anchor_lang::prelude::*;

use crate::errors::ChainJusticeError;
use crate::state::{AiModel, CaseStatus, CourtCase, Verdict};

pub const TRUST_PENALTY_ON_LOSS: u64 = 20;
pub const TRUST_BONUS_ON_WIN: u64 = 5;

#[derive(Accounts)]
pub struct EnforceVerdict<'info> {
	#[account(mut)]
	pub authority: Signer<'info>,

	#[account(
		mut,
		seeds = [b"court_case", court_case.defendant_model.as_ref(), court_case.complainant.as_ref()],
		bump = court_case.bump
	)]
	pub court_case: Account<'info, CourtCase>,

	#[account(
		mut,
		constraint = ai_model.key() == court_case.defendant_model @ ChainJusticeError::Unauthorized
	)]
	pub ai_model: Account<'info, AiModel>,
}

pub fn handler(ctx: Context<EnforceVerdict>) -> Result<()> {
	let court_case = &mut ctx.accounts.court_case;
	let ai_model = &mut ctx.accounts.ai_model;
	let authority_key = ctx.accounts.authority.key();

	if authority_key != ai_model.owner && authority_key != court_case.complainant {
		return Err(ChainJusticeError::Unauthorized.into());
	}

	if court_case.status != CaseStatus::Closed {
		return Err(ChainJusticeError::CaseNotOpen.into());
	}

	if court_case.verdict == Verdict::Pending {
		return Err(ChainJusticeError::CaseNotOpen.into());
	}

	if court_case.closed_at < 0 {
		return Err(ChainJusticeError::CaseAlreadyResolved.into());
	}

	match court_case.verdict {
		Verdict::PlaintiffWin => {
			ai_model.violation_count = ai_model
				.violation_count
				.checked_add(1)
				.ok_or(ChainJusticeError::MathOverflow)?;
			ai_model.trust_score = ai_model.trust_score.saturating_sub(TRUST_PENALTY_ON_LOSS);
		}
		Verdict::DefendantWin => {
			ai_model.trust_score = ai_model
				.trust_score
				.checked_add(TRUST_BONUS_ON_WIN)
				.ok_or(ChainJusticeError::MathOverflow)?;
		}
		Verdict::Split => {}
		Verdict::Pending => return Err(ChainJusticeError::CaseNotOpen.into()),
	}

	// Mark the resolution as enforced while preserving the absolute close timestamp.
	court_case.closed_at = court_case
		.closed_at
		.checked_neg()
		.ok_or(ChainJusticeError::MathOverflow)?;

	Ok(())
}
