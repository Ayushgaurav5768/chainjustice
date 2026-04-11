use anchor_lang::prelude::*;
use crate::errors::ChainJusticeError;
use crate::state::{CaseStatus, CourtCase, Verdict, CASE_DESCRIPTION_MAX, COURTCASE_SIZE};

pub const CASE_ID_COUNTER_SEED: &[u8] = b"case_id_counter";

#[derive(Accounts)]
pub struct FileCase<'info> {
    #[account(mut)]
    pub complainant: Signer<'info>,

    /// CHECK: This is the defendant AI model account. Ownership is verified elsewhere.
    pub defendant_model: AccountInfo<'info>,

    #[account(
        init,
        payer = complainant,
        space = 8 + COURTCASE_SIZE,
        seeds = [b"court_case", defendant_model.key().as_ref(), complainant.key().as_ref()],
        bump
    )]
    pub court_case: Account<'info, CourtCase>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<FileCase>,
    title: String,
    description: String,
) -> Result<()> {
    // Validate title (non-empty; length enforced by Account serialization)
    if title.is_empty() {
        return Err(ChainJusticeError::InvalidModelName.into());
    }

    // Validate description
    if description.is_empty() || description.len() > CASE_DESCRIPTION_MAX {
        return Err(ChainJusticeError::InvalidDescription.into());
    }

    let court_case = &mut ctx.accounts.court_case;
    let clock = Clock::get()?;

    court_case.id = 0; // Would be incremented by a global counter in production
    court_case.complainant = ctx.accounts.complainant.key();
    court_case.defendant_model = ctx.accounts.defendant_model.key();
    court_case.title = title;
    court_case.description = description;
    court_case.status = CaseStatus::Open;
    court_case.evidence_cids = Vec::new();
    court_case.ai_analysis = String::new();
    court_case.verdict = Verdict::Pending;
    court_case.created_at = clock.unix_timestamp;
    court_case.closed_at = 0;
    court_case.bump = ctx.bumps.court_case;

    Ok(())
}
