use anchor_lang::prelude::*;
use crate::errors::ChainJusticeError;
use crate::state::{CaseStatus, CourtCase};

#[derive(Accounts)]
pub struct SelectJurors<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"court_case", court_case.defendant_model.as_ref(), court_case.complainant.as_ref()],
        bump = court_case.bump
    )]
    pub court_case: Account<'info, CourtCase>,

    // Juror accounts passed as remaining_accounts
    // Each will be updated to point to this court case
}

pub fn handler(
    ctx: Context<SelectJurors>,
    juror_count: u8,
) -> Result<()> {
    let court_case = &mut ctx.accounts.court_case;

    // Prevent selecting jurors for resolved cases
    if court_case.status == CaseStatus::Closed || court_case.status == CaseStatus::Appealed {
        return Err(ChainJusticeError::CaseAlreadyResolved.into());
    }

    let juror_count = juror_count as usize;

    // Validate juror count
    if juror_count == 0 || juror_count > 10 {
        return Err(ChainJusticeError::InvalidJuror.into());
    }

    // Verify we have enough juror accounts provided
    if ctx.remaining_accounts.len() < juror_count {
        return Err(ChainJusticeError::InvalidJuror.into());
    }

    // Update each juror account to reference this case
    for i in 0..juror_count {
        let juror_account_info = &ctx.remaining_accounts[i];

        // Verify account is writable and owned by program
        if !juror_account_info.is_writable {
            return Err(ChainJusticeError::InvalidJuror.into());
        }
        if juror_account_info.owner != ctx.program_id {
            return Err(ChainJusticeError::InvalidJuror.into());
        }

        // Verify account size is correct for Juror
        let juror_size = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1;
        if juror_account_info.data_len() != juror_size {
            return Err(ChainJusticeError::InvalidJuror.into());
        }

        // Read juror authority from account data to verify PDA
        let data = juror_account_info.data.borrow();
        let authority_bytes = &data[8..40];
        let authority = Pubkey::new_from_array(
            <[u8; 32]>::try_from(authority_bytes).map_err(|_| ChainJusticeError::InvalidJuror)?
        );
        drop(data);

        // Verify this is a valid Juror PDA
        let expected_seeds = &[b"juror".as_ref(), authority.as_ref()];
        let (expected_pubkey, _bump) = Pubkey::find_program_address(expected_seeds, ctx.program_id);
        if expected_pubkey != juror_account_info.key() {
            return Err(ChainJusticeError::InvalidJuror.into());
        }
    }

    // Update case status to UnderReview
    court_case.status = CaseStatus::UnderReview;

    Ok(())
}
