use anchor_lang::prelude::*;

pub const MODEL_NAME_MAX: usize = 100;
pub const MODEL_DESCRIPTION_MAX: usize = 500;
pub const CASE_TITLE_MAX: usize = 200;
pub const CASE_DESCRIPTION_MAX: usize = 1000;
pub const EVIDENCE_CID_MAX: usize = 59;
pub const AI_ANALYSIS_MAX: usize = 500;
pub const MAX_EVIDENCE_COUNT: usize = 10;

pub const AIMODEL_SIZE: usize = 8 + 32 + (4 + MODEL_NAME_MAX) + (4 + MODEL_DESCRIPTION_MAX) + 8 + 8 + 8 + 8 + 1;
pub const COURTCASE_SIZE: usize = 8 + 8 + 32 + 32 + (4 + CASE_TITLE_MAX) + (4 + CASE_DESCRIPTION_MAX) + 1 + (4 + (MAX_EVIDENCE_COUNT * (4 + EVIDENCE_CID_MAX))) + (4 + AI_ANALYSIS_MAX) + 1 + 8 + 8 + 1;
pub const JUROR_SIZE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    UnderReview,
    Closed,
    Appealed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Verdict {
    Pending,
    PlaintiffWin,
    DefendantWin,
    Split,
}

#[account]
pub struct AiModel {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub insurance_deposit: u64,
    pub trust_score: u64,
    pub violation_count: u64,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct CourtCase {
    pub id: u64,
    pub complainant: Pubkey,
    pub defendant_model: Pubkey,
    pub title: String,
    pub description: String,
    pub status: CaseStatus,
    pub evidence_cids: Vec<String>,
    pub ai_analysis: String,
    pub verdict: Verdict,
    pub created_at: i64,
    pub closed_at: i64,
    pub bump: u8,
}

#[account]
pub struct Juror {
    pub authority: Pubkey,
    pub case_account: Pubkey,
    pub votes_for_plaintiff: u64,
    pub votes_for_defendant: u64,
    pub joined_at: i64,
    pub verdict: Verdict,
    pub bump: u8,
}
