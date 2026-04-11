use anchor_lang::prelude::*;
use crate::errors::ChainJusticeError;
use crate::state::{CaseStatus, CourtCase, EVIDENCE_CID_MAX, MAX_EVIDENCE_COUNT};

#[derive(Accounts)]
pub struct SubmitEvidence<'info> {
    #[account(mut)]
    pub submitter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"court_case", court_case.defendant_model.as_ref(), court_case.complainant.as_ref()],
        bump = court_case.bump,
        has_one = complainant
    )]
    pub court_case: Account<'info, CourtCase>,

    /// CHECK: Must be the complainant or defendant owner
    pub complainant: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<SubmitEvidence>,
    evidence_cid: String,
) -> Result<()> {
    let court_case = &mut ctx.accounts.court_case;

    // Verify case is still open
    if court_case.status != CaseStatus::Open {
        return Err(ChainJusticeError::CaseNotOpen.into());
    }

    // Verify submitter is authorized (must be complainant)
    if ctx.accounts.submitter.key() != court_case.complainant {
        return Err(ChainJusticeError::Unauthorized.into());
    }

    // Validate evidence CID
    if evidence_cid.is_empty() || evidence_cid.len() > EVIDENCE_CID_MAX {
        return Err(ChainJusticeError::InvalidEvidence.into());
    }

    // Check evidence count limit
    if court_case.evidence_cids.len() >= MAX_EVIDENCE_COUNT {
        return Err(ChainJusticeError::InvalidEvidence.into());
    }

    // Add evidence CID to case
    court_case.evidence_cids.push(evidence_cid);

    Ok(())
}
