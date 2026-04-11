use anchor_lang::prelude::*;

use crate::errors::ChainJusticeError;
use crate::state::{CaseStatus, CourtCase, Juror, Verdict};

pub const REQUIRED_VOTES: u64 = 3;

#[derive(Accounts)]
pub struct CastVote<'info> {
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
		seeds = [b"juror", authority.key().as_ref()],
		bump = juror.bump,
		constraint = juror.authority == authority.key() @ ChainJusticeError::Unauthorized,
		constraint = juror.case_account == court_case.key() @ ChainJusticeError::InvalidJuror
	)]
	pub juror: Account<'info, Juror>,
}

pub fn handler(ctx: Context<CastVote>, plaintiff: bool) -> Result<()> {
	let court_case = &mut ctx.accounts.court_case;
	let juror = &mut ctx.accounts.juror;

	if court_case.status == CaseStatus::Closed || court_case.status == CaseStatus::Appealed {
		return Err(ChainJusticeError::CaseAlreadyResolved.into());
	}

	if court_case.status != CaseStatus::UnderReview {
		return Err(ChainJusticeError::CaseNotOpen.into());
	}

	if court_case.ai_analysis.is_empty() {
		return Err(ChainJusticeError::CaseNotOpen.into());
	}

	if juror.verdict != Verdict::Pending {
		return Err(ChainJusticeError::DuplicateVote.into());
	}

	if plaintiff {
		juror.votes_for_plaintiff = juror
			.votes_for_plaintiff
			.checked_add(1)
			.ok_or(ChainJusticeError::MathOverflow)?;
		juror.verdict = Verdict::PlaintiffWin;
	} else {
		juror.votes_for_defendant = juror
			.votes_for_defendant
			.checked_add(1)
			.ok_or(ChainJusticeError::MathOverflow)?;
		juror.verdict = Verdict::DefendantWin;
	}

	let mut plaintiff_votes = 0u64;
	let mut defendant_votes = 0u64;

	if juror.verdict != Verdict::Pending {
		if juror.votes_for_plaintiff > juror.votes_for_defendant {
			plaintiff_votes = plaintiff_votes.saturating_add(juror.votes_for_plaintiff);
		} else if juror.votes_for_defendant > juror.votes_for_plaintiff {
			defendant_votes = defendant_votes.saturating_add(juror.votes_for_defendant);
		}
	}

	let remaining_accounts = ctx.remaining_accounts.to_vec();

	for remaining_account in remaining_accounts {
		if remaining_account.key() == juror.key() {
			continue;
		}

		if remaining_account.owner != ctx.program_id {
			return Err(ChainJusticeError::InvalidJuror.into());
		}

		let data = remaining_account
			.try_borrow_data()
			.map_err(|_| ChainJusticeError::InvalidJuror)?;
		let mut data_slice: &[u8] = &data;
		let remaining_juror = Juror::try_deserialize(&mut data_slice)
			.map_err(|_| ChainJusticeError::InvalidJuror)?;

		if remaining_juror.case_account != court_case.key() {
			return Err(ChainJusticeError::InvalidJuror.into());
		}

		tally_juror_vote(&remaining_juror, &mut plaintiff_votes, &mut defendant_votes);
	}

	let total_votes = plaintiff_votes
		.checked_add(defendant_votes)
		.ok_or(ChainJusticeError::MathOverflow)?;

	if total_votes >= REQUIRED_VOTES {
		court_case.verdict = if plaintiff_votes > defendant_votes {
			Verdict::PlaintiffWin
		} else if defendant_votes > plaintiff_votes {
			Verdict::DefendantWin
		} else {
			Verdict::Split
		};
		court_case.status = CaseStatus::Closed;
		court_case.closed_at = Clock::get()?.unix_timestamp;
	}

	Ok(())
}

fn tally_juror_vote(
	juror: &Juror,
	plaintiff_votes: &mut u64,
	defendant_votes: &mut u64,
) {
	if juror.verdict == Verdict::Pending {
		return;
	}

	if juror.votes_for_plaintiff > juror.votes_for_defendant {
		*plaintiff_votes = plaintiff_votes.saturating_add(juror.votes_for_plaintiff);
	} else if juror.votes_for_defendant > juror.votes_for_plaintiff {
		*defendant_votes = defendant_votes.saturating_add(juror.votes_for_defendant);
	}
}
