use anchor_lang::prelude::*;

use crate::errors::ChainJusticeError;
use crate::state::{CaseStatus, CourtCase, AI_ANALYSIS_MAX};

#[derive(Accounts)]
pub struct SubmitAiAnalysis<'info> {
	#[account(mut)]
	pub authority: Signer<'info>,

	#[account(
		mut,
		seeds = [b"court_case", court_case.defendant_model.as_ref(), court_case.complainant.as_ref()],
		bump = court_case.bump
	)]
	pub court_case: Account<'info, CourtCase>,
}

pub fn handler(ctx: Context<SubmitAiAnalysis>, analysis: String) -> Result<()> {
	let court_case = &mut ctx.accounts.court_case;

	// Do not allow updates after the case is finalized.
	if court_case.status == CaseStatus::Closed || court_case.status == CaseStatus::Appealed {
		return Err(ChainJusticeError::CaseAlreadyResolved.into());
	}

	// Analysis must be present and fit within the stored account budget.
	if analysis.is_empty() || analysis.len() > AI_ANALYSIS_MAX {
		return Err(ChainJusticeError::InvalidDescription.into());
	}

	// Store the AI analysis summary or reference text on-chain.
	court_case.ai_analysis = analysis;

	// Move the case into review so jurors can vote.
	court_case.status = CaseStatus::UnderReview;

	Ok(())
}
