#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("G6UN14ZNB6TpXgohEzmaXBGmfwzpmgRPi4w7p4p39woC");

pub const MAX_MODEL_FAMILY_LEN: usize = 64;
pub const MAX_MODEL_NAME_LEN: usize = 64;
pub const MAX_MODEL_URI_LEN: usize = 128;
pub const MAX_CASE_TITLE_LEN: usize = 120;
pub const MAX_CASE_SUMMARY_LEN: usize = 512;
pub const MAX_EVIDENCE_CID_LEN: usize = 96;
pub const MAX_EVIDENCE_MIME_LEN: usize = 32;
pub const MAX_EVIDENCE_DESC_LEN: usize = 256;
pub const MAX_AI_ANALYSIS_URI_LEN: usize = 128;
pub const MAX_SELECTED_JURORS: usize = 15;

pub const DEFAULT_TRUST_SCORE: i32 = 70;
pub const MIN_TRUST_SCORE: i32 = 0;
pub const MAX_TRUST_SCORE: i32 = 100;

#[program]
pub mod chainjustice {
    use super::*;

    /// One-time registry initialization. Stores governance authority and case counter.
    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        let now = Clock::get()?.unix_timestamp;

        registry.authority = ctx.accounts.authority.key();
        registry.next_case_id = 1;
        registry.created_at = now;
        registry.updated_at = now;
        registry.bump = ctx.bumps.registry;

        Ok(())
    }

    /// Registers an AI model profile with initial metadata and optional initial insurance deposit.
    pub fn register_ai_model(
        ctx: Context<RegisterAiModel>,
        model_family: String,
        model_name: String,
        metadata_uri: String,
        initial_deposit_lamports: u64,
    ) -> Result<()> {
        require!(
            !model_family.is_empty() && model_family.len() <= MAX_MODEL_FAMILY_LEN,
            ChainJusticeError::InvalidInput
        );
        require!(
            !model_name.is_empty() && model_name.len() <= MAX_MODEL_NAME_LEN,
            ChainJusticeError::InvalidInput
        );
        require!(metadata_uri.len() <= MAX_MODEL_URI_LEN, ChainJusticeError::InvalidInput);

        if initial_deposit_lamports > 0 {
            transfer_lamports(
                &ctx.accounts.provider.to_account_info(),
                &ctx.accounts.ai_model.to_account_info(),
                &ctx.accounts.system_program.to_account_info(),
                initial_deposit_lamports,
            )?;
        }

        let now = Clock::get()?.unix_timestamp;
        let model = &mut ctx.accounts.ai_model;

        model.provider = ctx.accounts.provider.key();
        model.model_family = model_family;
        model.model_name = model_name;
        model.metadata_uri = metadata_uri;
        model.trust_score = DEFAULT_TRUST_SCORE;
        model.insurance_pool_lamports = 0;
        model.total_cases = 0;
        model.violation_count = 0;
        model.is_active = true;
        model.created_at = now;
        model.updated_at = now;
        model.bump = ctx.bumps.ai_model;

        model.insurance_pool_lamports = initial_deposit_lamports;

        Ok(())
    }

    /// Adds SOL insurance liquidity to a model's insurance pool.
    pub fn deposit_insurance(ctx: Context<DepositInsurance>, amount_lamports: u64) -> Result<()> {
        require!(amount_lamports > 0, ChainJusticeError::InvalidAmount);

        transfer_lamports(
            &ctx.accounts.depositor.to_account_info(),
            &ctx.accounts.ai_model.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            amount_lamports,
        )?;

        let model = &mut ctx.accounts.ai_model;
        model.insurance_pool_lamports = model
            .insurance_pool_lamports
            .checked_add(amount_lamports)
            .ok_or(ChainJusticeError::MathOverflow)?;
        model.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Opens a new case against a model.
    /// Case seeds use ["case", case_id_le_bytes], and case_id must equal registry.next_case_id.
    pub fn file_case(
        ctx: Context<FileCase>,
        case_id: u64,
        title: String,
        summary: String,
        required_jurors: u8,
        voting_window_seconds: i64,
        excluded_provider_for_ai: Pubkey,
        excluded_model_family_hash_for_ai: [u8; 32],
    ) -> Result<()> {
        require!(title.len() > 2 && title.len() <= MAX_CASE_TITLE_LEN, ChainJusticeError::InvalidInput);
        require!(
            summary.len() > 5 && summary.len() <= MAX_CASE_SUMMARY_LEN,
            ChainJusticeError::InvalidInput
        );
        require!(required_jurors > 0 && required_jurors as usize <= MAX_SELECTED_JURORS, ChainJusticeError::InvalidInput);
        require!(voting_window_seconds > 0, ChainJusticeError::InvalidInput);

        let registry = &mut ctx.accounts.registry;
        require!(case_id == registry.next_case_id, ChainJusticeError::InvalidCaseId);

        let now = Clock::get()?.unix_timestamp;
        let case = &mut ctx.accounts.case_record;
        let model = &mut ctx.accounts.ai_model;

        case.case_id = case_id;
        case.complainant = ctx.accounts.complainant.key();
        case.defendant_model = model.key();
        case.defendant_provider = model.provider;
        case.title = title;
        case.summary = summary;
        case.status = CaseStatus::Open;
        case.verdict = VerdictOutcome::Pending;
        case.votes_for_plaintiff = 0;
        case.votes_for_defendant = 0;
        case.required_jurors = required_jurors;
        case.selected_jurors = Vec::new();
        case.evidence_count = 0;
        case.filed_at = now;
        case.voting_deadline = now
            .checked_add(voting_window_seconds)
            .ok_or(ChainJusticeError::MathOverflow)?;
        case.closed_at = 0;
        case.ai_analysis_submitted = false;
        case.ai_metadata_only = true;
        case.conflict_excluded_provider_for_ai = excluded_provider_for_ai;
        case.conflict_excluded_model_family_hash_for_ai = excluded_model_family_hash_for_ai;
        case.bump = ctx.bumps.case_record;

        registry.next_case_id = registry
            .next_case_id
            .checked_add(1)
            .ok_or(ChainJusticeError::MathOverflow)?;
        registry.updated_at = now;

        model.total_cases = model.total_cases.checked_add(1).ok_or(ChainJusticeError::MathOverflow)?;
        model.updated_at = now;

        Ok(())
    }

    /// Adds evidence metadata to a case as a PDA record. Evidence payload itself lives on IPFS.
    pub fn submit_evidence(
        ctx: Context<SubmitEvidence>,
        evidence_index: u16,
        evidence_cid: String,
        mime_type: String,
        description: String,
    ) -> Result<()> {
        require!(evidence_cid.len() > 20 && evidence_cid.len() <= MAX_EVIDENCE_CID_LEN, ChainJusticeError::InvalidInput);
        require!(mime_type.len() > 2 && mime_type.len() <= MAX_EVIDENCE_MIME_LEN, ChainJusticeError::InvalidInput);
        require!(description.len() <= MAX_EVIDENCE_DESC_LEN, ChainJusticeError::InvalidInput);

        let case = &mut ctx.accounts.case_record;
        require!(case.status == CaseStatus::Open, ChainJusticeError::CaseNotOpen);
        require!(evidence_index == case.evidence_count, ChainJusticeError::InvalidEvidenceIndex);

        let now = Clock::get()?.unix_timestamp;
        let evidence = &mut ctx.accounts.evidence_record;

        evidence.case = case.key();
        evidence.submitted_by = ctx.accounts.submitter.key();
        evidence.evidence_cid = evidence_cid;
        evidence.mime_type = mime_type;
        evidence.description = description;
        evidence.submitted_at = now;
        evidence.bump = ctx.bumps.evidence_record;

        case.evidence_count = case.evidence_count.checked_add(1).ok_or(ChainJusticeError::MathOverflow)?;

        Ok(())
    }

    /// Stakes SOL into a juror profile account for participation eligibility.
    pub fn stake_as_juror(ctx: Context<StakeAsJuror>, amount_lamports: u64) -> Result<()> {
        require!(amount_lamports > 0, ChainJusticeError::InvalidAmount);

        transfer_lamports(
            &ctx.accounts.juror.to_account_info(),
            &ctx.accounts.juror_profile.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            amount_lamports,
        )?;

        let profile = &mut ctx.accounts.juror_profile;
        let now = Clock::get()?.unix_timestamp;

        profile.authority = ctx.accounts.juror.key();
        profile.stake_lamports = amount_lamports;
        profile.active_cases = 0;
        profile.resolved_cases = 0;
        profile.last_stake_at = now;
        profile.bump = ctx.bumps.juror_profile;

        Ok(())
    }

    /// Stores selected juror authorities for the case.
    /// In MVP this is authority-driven. Frontend can pre-filter candidates by stake.
    pub fn select_jurors(ctx: Context<SelectJurors>, selected_jurors: Vec<Pubkey>) -> Result<()> {
        require!(ctx.accounts.selector.key() == ctx.accounts.authority.key(), ChainJusticeError::Unauthorized);
        require!(
            selected_jurors.len() > 0 && selected_jurors.len() <= MAX_SELECTED_JURORS,
            ChainJusticeError::InvalidInput
        );

        let case = &mut ctx.accounts.case_record;
        require!(case.status == CaseStatus::Open, ChainJusticeError::CaseNotOpen);
        require!(selected_jurors.len() == case.required_jurors as usize, ChainJusticeError::InvalidInput);

        for (idx, juror) in selected_jurors.iter().enumerate() {
            for prior in selected_jurors.iter().take(idx) {
                require!(juror != prior, ChainJusticeError::DuplicateSelection);
            }
        }

        case.selected_jurors = selected_jurors;
        case.status = CaseStatus::UnderReview;

        Ok(())
    }

    /// Logs AI analysis metadata for transparency only (non-binding by design).
    /// Also stores conflict-of-interest routing guard values for app-layer AI selection logic.
    pub fn submit_ai_analysis(
        ctx: Context<SubmitAiAnalysis>,
        analysis_uri: String,
        analysis_hash: [u8; 32],
        excluded_provider_for_ai: Pubkey,
        excluded_model_family_hash_for_ai: [u8; 32],
    ) -> Result<()> {
        require!(analysis_uri.len() <= MAX_AI_ANALYSIS_URI_LEN, ChainJusticeError::InvalidInput);

        let now = Clock::get()?.unix_timestamp;
        let case = &mut ctx.accounts.case_record;
        require!(
            case.status == CaseStatus::Open || case.status == CaseStatus::UnderReview,
            ChainJusticeError::CaseNotOpen
        );

        let ai_meta = &mut ctx.accounts.ai_decision_metadata;
        ai_meta.case = case.key();
        ai_meta.submitted_by = ctx.accounts.submitter.key();
        ai_meta.analysis_uri = analysis_uri;
        ai_meta.analysis_hash = analysis_hash;
        ai_meta.is_binding = false;
        ai_meta.excluded_provider_for_ai = excluded_provider_for_ai;
        ai_meta.excluded_model_family_hash_for_ai = excluded_model_family_hash_for_ai;
        ai_meta.submitted_at = now;
        ai_meta.bump = ctx.bumps.ai_decision_metadata;

        case.ai_analysis_submitted = true;
        case.ai_metadata_only = true;
        case.conflict_excluded_provider_for_ai = excluded_provider_for_ai;
        case.conflict_excluded_model_family_hash_for_ai = excluded_model_family_hash_for_ai;

        Ok(())
    }

    /// Updates existing AI analysis metadata for append-only audit revisions.
    pub fn log_ai_decision(
        ctx: Context<LogAiDecision>,
        analysis_uri: String,
        analysis_hash: [u8; 32],
        excluded_provider_for_ai: Pubkey,
        excluded_model_family_hash_for_ai: [u8; 32],
    ) -> Result<()> {
        require!(analysis_uri.len() <= MAX_AI_ANALYSIS_URI_LEN, ChainJusticeError::InvalidInput);

        let case = &ctx.accounts.case_record;
        let ai_meta = &mut ctx.accounts.ai_decision_metadata;

        require!(ai_meta.case == case.key(), ChainJusticeError::InvalidState);

        ai_meta.submitted_by = ctx.accounts.submitter.key();
        ai_meta.analysis_uri = analysis_uri;
        ai_meta.analysis_hash = analysis_hash;
        ai_meta.is_binding = false;
        ai_meta.excluded_provider_for_ai = excluded_provider_for_ai;
        ai_meta.excluded_model_family_hash_for_ai = excluded_model_family_hash_for_ai;
        ai_meta.submitted_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// A single juror can vote once. Human votes are the only binding signal.
    pub fn cast_vote(ctx: Context<CastVote>, side: VoteSide, reason_hash: [u8; 32]) -> Result<()> {
        let case = &mut ctx.accounts.case_record;
        let juror = &mut ctx.accounts.juror_profile;

        require!(case.status == CaseStatus::UnderReview, ChainJusticeError::CaseNotOpen);
        require!(case.selected_jurors.contains(&ctx.accounts.voter.key()), ChainJusticeError::JurorNotSelected);
        require!(juror.authority == ctx.accounts.voter.key(), ChainJusticeError::Unauthorized);
        require!(juror.stake_lamports > 0, ChainJusticeError::InsufficientStake);

        let vote = &mut ctx.accounts.vote_record;
        vote.case = case.key();
        vote.juror = juror.authority;
        vote.side = side;
        vote.reason_hash = reason_hash;
        vote.voted_at = Clock::get()?.unix_timestamp;
        vote.bump = ctx.bumps.vote_record;

        match side {
            VoteSide::Plaintiff => {
                case.votes_for_plaintiff = case
                    .votes_for_plaintiff
                    .checked_add(1)
                    .ok_or(ChainJusticeError::MathOverflow)?;
            }
            VoteSide::Defendant => {
                case.votes_for_defendant = case
                    .votes_for_defendant
                    .checked_add(1)
                    .ok_or(ChainJusticeError::MathOverflow)?;
            }
        }

        juror.active_cases = juror.active_cases.checked_add(1).ok_or(ChainJusticeError::MathOverflow)?;

        Ok(())
    }

    /// Finalizes a case based exclusively on human juror votes and updates ledger + model economics.
    pub fn enforce_verdict(ctx: Context<EnforceVerdict>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let case = &mut ctx.accounts.case_record;

        require!(case.status == CaseStatus::UnderReview, ChainJusticeError::CaseNotOpen);

        let total_votes = case
            .votes_for_plaintiff
            .checked_add(case.votes_for_defendant)
            .ok_or(ChainJusticeError::MathOverflow)?;

        let quorum_met = total_votes >= case.required_jurors as u16;
        let voting_expired = now >= case.voting_deadline;
        require!(quorum_met || (voting_expired && total_votes > 0), ChainJusticeError::NotEnoughVotes);

        let ai_model_account = ctx.accounts.ai_model.to_account_info();
        let complainant_account = ctx.accounts.complainant.to_account_info();

        let outcome = if case.votes_for_plaintiff > case.votes_for_defendant {
            VerdictOutcome::Plaintiff
        } else if case.votes_for_defendant > case.votes_for_plaintiff {
            VerdictOutcome::Defendant
        } else {
            VerdictOutcome::Split
        };

        let (trust_before, trust_after, insurance_before, insurance_after, payout) = {
            let model = &mut ctx.accounts.ai_model;
            let (trust_delta, payout) = match outcome {
                VerdictOutcome::Plaintiff => {
                    model.violation_count = model
                        .violation_count
                        .checked_add(1)
                        .ok_or(ChainJusticeError::MathOverflow)?;

                    let payout = model.insurance_pool_lamports / 20;
                    if payout > 0 {
                        model.insurance_pool_lamports = model
                            .insurance_pool_lamports
                            .checked_sub(payout)
                            .ok_or(ChainJusticeError::MathOverflow)?;
                    }
                    (-10, payout)
                }
                VerdictOutcome::Defendant => (2, 0),
                VerdictOutcome::Split => (-3, 0),
                VerdictOutcome::Pending => return err!(ChainJusticeError::InvalidState),
            };

            let trust_before = model.trust_score;
            let insurance_before = model.insurance_pool_lamports.checked_add(payout).ok_or(ChainJusticeError::MathOverflow)?;
            model.trust_score = clamp_trust(model.trust_score.saturating_add(trust_delta));
            model.updated_at = now;

            (
                trust_before,
                model.trust_score,
                insurance_before,
                model.insurance_pool_lamports,
                payout,
            )
        };

        if payout > 0 {
            transfer_lamports_from_program_account(&ai_model_account, &complainant_account, payout)?;
        }

        case.verdict = outcome;
        case.status = CaseStatus::Closed;
        case.closed_at = now;

        let ledger = &mut ctx.accounts.verdict_ledger;
        ledger.case = case.key();
        ledger.model = ctx.accounts.ai_model.key();
        ledger.outcome = outcome;
        ledger.trust_before = trust_before;
        ledger.trust_after = trust_after;
        ledger.insurance_pool_before = insurance_before;
        ledger.insurance_pool_after = insurance_after;
        ledger.payout_lamports = payout;
        ledger.ai_metadata_hash = ctx.accounts.ai_decision_metadata.analysis_hash;
        ledger.recorded_at = now;
        ledger.slot = Clock::get()?.slot;
        ledger.enforced_by = ctx.accounts.enforcer.key();
        ledger.bump = ctx.bumps.verdict_ledger;

        Ok(())
    }

    /// Governance override / appeal path. Can only be run after a case is closed.
    pub fn update_trust_score(
        ctx: Context<UpdateTrustScore>,
        delta: i32,
        reason_code: u8,
    ) -> Result<()> {
        require!(delta != 0, ChainJusticeError::InvalidInput);
        require!(reason_code > 0, ChainJusticeError::InvalidInput);
        require!(ctx.accounts.case_record.status == CaseStatus::Closed, ChainJusticeError::CaseNotClosed);

        let model = &mut ctx.accounts.ai_model;
        model.trust_score = clamp_trust(model.trust_score.saturating_add(delta));
        model.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

fn clamp_trust(value: i32) -> i32 {
    value.clamp(MIN_TRUST_SCORE, MAX_TRUST_SCORE)
}

fn transfer_lamports<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        system_program.clone(),
        Transfer {
            from: from.clone(),
            to: to.clone(),
        },
    );
    system_program::transfer(cpi_ctx, amount)
}

fn transfer_lamports_from_program_account(
    from_program_account: &AccountInfo<'_>,
    to_account: &AccountInfo<'_>,
    amount: u64,
) -> Result<()> {
    let from_balance = from_program_account.lamports();
    require!(from_balance >= amount, ChainJusticeError::InsufficientInsurancePool);

    **from_program_account.try_borrow_mut_lamports()? = from_balance
        .checked_sub(amount)
        .ok_or(ChainJusticeError::MathOverflow)?;
    **to_account.try_borrow_mut_lamports()? = to_account
        .lamports()
        .checked_add(amount)
        .ok_or(ChainJusticeError::MathOverflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"registry"],
        bump,
        space = Registry::LEN,
    )]
    pub registry: Account<'info, Registry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterAiModel<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,
    #[account(
        init,
        payer = provider,
        seeds = [b"ai_model", provider.key().as_ref()],
        bump,
        space = AiModelProfile::LEN,
    )]
    pub ai_model: Account<'info, AiModelProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositInsurance<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub ai_model: Account<'info, AiModelProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(case_id: u64)]
pub struct FileCase<'info> {
    #[account(mut)]
    pub complainant: Signer<'info>,
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump,
    )]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub ai_model: Account<'info, AiModelProfile>,
    #[account(
        init,
        payer = complainant,
        seeds = [b"case_record", case_id.to_le_bytes().as_ref()],
        bump,
        space = CaseRecord::LEN,
    )]
    pub case_record: Account<'info, CaseRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(evidence_index: u16)]
pub struct SubmitEvidence<'info> {
    #[account(mut)]
    pub submitter: Signer<'info>,
    #[account(mut)]
    pub case_record: Account<'info, CaseRecord>,
    #[account(
        init,
        payer = submitter,
        seeds = [
            b"evidence_record",
            case_record.key().as_ref(),
            evidence_index.to_le_bytes().as_ref(),
        ],
        bump,
        space = EvidenceRecord::LEN,
    )]
    pub evidence_record: Account<'info, EvidenceRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeAsJuror<'info> {
    #[account(mut)]
    pub juror: Signer<'info>,
    #[account(
        init,
        payer = juror,
        seeds = [b"juror_profile", juror.key().as_ref()],
        bump,
        space = JurorProfile::LEN,
    )]
    pub juror_profile: Account<'info, JurorProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SelectJurors<'info> {
    pub selector: Signer<'info>,
    #[account(
        seeds = [b"registry"],
        bump = registry.bump,
        has_one = authority,
    )]
    pub registry: Account<'info, Registry>,
    /// CHECK: validated by has_one against registry.authority
    pub authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub case_record: Account<'info, CaseRecord>,
}

#[derive(Accounts)]
pub struct SubmitAiAnalysis<'info> {
    #[account(mut)]
    pub submitter: Signer<'info>,
    #[account(mut)]
    pub case_record: Account<'info, CaseRecord>,
    #[account(
        init,
        payer = submitter,
        seeds = [b"ai_decision", case_record.key().as_ref()],
        bump,
        space = AiDecisionMetadata::LEN,
    )]
    pub ai_decision_metadata: Account<'info, AiDecisionMetadata>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LogAiDecision<'info> {
    #[account(mut)]
    pub submitter: Signer<'info>,
    pub case_record: Account<'info, CaseRecord>,
    #[account(
        mut,
        seeds = [b"ai_decision", case_record.key().as_ref()],
        bump = ai_decision_metadata.bump,
    )]
    pub ai_decision_metadata: Account<'info, AiDecisionMetadata>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub case_record: Account<'info, CaseRecord>,
    #[account(
        mut,
        seeds = [b"juror_profile", voter.key().as_ref()],
        bump = juror_profile.bump,
    )]
    pub juror_profile: Account<'info, JurorProfile>,
    #[account(
        init,
        payer = voter,
        seeds = [b"vote_record", case_record.key().as_ref(), voter.key().as_ref()],
        bump,
        space = VoteRecord::LEN,
    )]
    pub vote_record: Account<'info, VoteRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EnforceVerdict<'info> {
    #[account(mut)]
    pub enforcer: Signer<'info>,
    #[account(mut)]
    pub complainant: SystemAccount<'info>,
    #[account(mut)]
    pub case_record: Account<'info, CaseRecord>,
    #[account(mut)]
    pub ai_model: Account<'info, AiModelProfile>,
    #[account(
        seeds = [b"ai_decision", case_record.key().as_ref()],
        bump = ai_decision_metadata.bump,
    )]
    pub ai_decision_metadata: Account<'info, AiDecisionMetadata>,
    #[account(
        init,
        payer = enforcer,
        seeds = [b"verdict_ledger", case_record.key().as_ref()],
        bump,
        space = VerdictLedger::LEN,
    )]
    pub verdict_ledger: Account<'info, VerdictLedger>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTrustScore<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"registry"],
        bump = registry.bump,
        has_one = authority,
    )]
    pub registry: Account<'info, Registry>,
    pub case_record: Account<'info, CaseRecord>,
    #[account(mut)]
    pub ai_model: Account<'info, AiModelProfile>,
}

#[account]
pub struct Registry {
    pub authority: Pubkey,
    pub next_case_id: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl Registry {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct AiModelProfile {
    pub provider: Pubkey,
    pub model_family: String,
    pub model_name: String,
    pub metadata_uri: String,
    pub trust_score: i32,
    pub insurance_pool_lamports: u64,
    pub total_cases: u64,
    pub violation_count: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl AiModelProfile {
    pub const LEN: usize =
        8 + 32 + (4 + MAX_MODEL_FAMILY_LEN) + (4 + MAX_MODEL_NAME_LEN) + (4 + MAX_MODEL_URI_LEN)
            + 4
            + 8
            + 8
            + 8
            + 1
            + 8
            + 8
            + 1;
}

#[account]
pub struct CaseRecord {
    pub case_id: u64,
    pub complainant: Pubkey,
    pub defendant_model: Pubkey,
    pub defendant_provider: Pubkey,
    pub title: String,
    pub summary: String,
    pub status: CaseStatus,
    pub verdict: VerdictOutcome,
    pub votes_for_plaintiff: u16,
    pub votes_for_defendant: u16,
    pub required_jurors: u8,
    pub selected_jurors: Vec<Pubkey>,
    pub evidence_count: u16,
    pub filed_at: i64,
    pub voting_deadline: i64,
    pub closed_at: i64,
    pub ai_analysis_submitted: bool,
    pub ai_metadata_only: bool,
    pub conflict_excluded_provider_for_ai: Pubkey,
    pub conflict_excluded_model_family_hash_for_ai: [u8; 32],
    pub bump: u8,
}

impl CaseRecord {
    pub const LEN: usize =
        8 + 8 + 32 + 32 + 32 + (4 + MAX_CASE_TITLE_LEN) + (4 + MAX_CASE_SUMMARY_LEN)
            + 1
            + 1
            + 2
            + 2
            + 1
            + (4 + (MAX_SELECTED_JURORS * 32))
            + 2
            + 8
            + 8
            + 8
            + 1
            + 1
            + 32
            + 32
            + 1;
}

#[account]
pub struct EvidenceRecord {
    pub case: Pubkey,
    pub submitted_by: Pubkey,
    pub evidence_cid: String,
    pub mime_type: String,
    pub description: String,
    pub submitted_at: i64,
    pub bump: u8,
}

impl EvidenceRecord {
    pub const LEN: usize =
        8 + 32 + 32 + (4 + MAX_EVIDENCE_CID_LEN) + (4 + MAX_EVIDENCE_MIME_LEN)
            + (4 + MAX_EVIDENCE_DESC_LEN)
            + 8
            + 1;
}

#[account]
pub struct JurorProfile {
    pub authority: Pubkey,
    pub stake_lamports: u64,
    pub active_cases: u16,
    pub resolved_cases: u32,
    pub last_stake_at: i64,
    pub bump: u8,
}

impl JurorProfile {
    pub const LEN: usize = 8 + 32 + 8 + 2 + 4 + 8 + 1;
}

#[account]
pub struct VoteRecord {
    pub case: Pubkey,
    pub juror: Pubkey,
    pub side: VoteSide,
    pub reason_hash: [u8; 32],
    pub voted_at: i64,
    pub bump: u8,
}

impl VoteRecord {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 32 + 8 + 1;
}

#[account]
pub struct VerdictLedger {
    pub case: Pubkey,
    pub model: Pubkey,
    pub outcome: VerdictOutcome,
    pub trust_before: i32,
    pub trust_after: i32,
    pub insurance_pool_before: u64,
    pub insurance_pool_after: u64,
    pub payout_lamports: u64,
    pub ai_metadata_hash: [u8; 32],
    pub recorded_at: i64,
    pub slot: u64,
    pub enforced_by: Pubkey,
    pub bump: u8,
}

impl VerdictLedger {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 4 + 4 + 8 + 8 + 8 + 32 + 8 + 8 + 32 + 1;
}

#[account]
pub struct AiDecisionMetadata {
    pub case: Pubkey,
    pub submitted_by: Pubkey,
    pub analysis_uri: String,
    pub analysis_hash: [u8; 32],
    pub is_binding: bool,
    pub excluded_provider_for_ai: Pubkey,
    pub excluded_model_family_hash_for_ai: [u8; 32],
    pub submitted_at: i64,
    pub bump: u8,
}

impl AiDecisionMetadata {
    pub const LEN: usize =
        8 + 32 + 32 + (4 + MAX_AI_ANALYSIS_URI_LEN) + 32 + 1 + 32 + 32 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VoteSide {
    Plaintiff,
    Defendant,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VerdictOutcome {
    Pending,
    Plaintiff,
    Defendant,
    Split,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    UnderReview,
    Closed,
}

#[error_code]
pub enum ChainJusticeError {
    #[msg("Input failed validation checks")]
    InvalidInput,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Unauthorized signer or authority mismatch")]
    Unauthorized,
    #[msg("Case is not open for this action")]
    CaseNotOpen,
    #[msg("Case has not been closed yet")]
    CaseNotClosed,
    #[msg("Case id does not match next expected id")]
    InvalidCaseId,
    #[msg("Evidence index is out of sequence")]
    InvalidEvidenceIndex,
    #[msg("Juror is not selected for this case")]
    JurorNotSelected,
    #[msg("Juror stake is insufficient")]
    InsufficientStake,
    #[msg("Not enough votes to enforce verdict")]
    NotEnoughVotes,
    #[msg("Insurance pool is insufficient for payout")]
    InsufficientInsurancePool,
    #[msg("Duplicate juror in selection")]
    DuplicateSelection,
    #[msg("Invalid program state")]
    InvalidState,
}