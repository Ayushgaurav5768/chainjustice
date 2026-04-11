#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("G6UN14ZNB6TpXgohEzmaXBGmfwzpmgRPi4w7p4p39woC");

#[program]
pub mod chainjustice {
    use super::*;

    pub fn register_ai_model(
        ctx: Context<RegisterAiModel>,
        name: String,
        description: String,
        insurance_deposit: u64,
    ) -> Result<()> {
        instructions::register_ai_model::handler(ctx, name, description, insurance_deposit)
    }

    pub fn log_ai_decision(
        ctx: Context<LogAiDecision>,
        decision_hash: [u8; 32],
    ) -> Result<()> {
        instructions::log_ai_decision::handler(ctx, decision_hash)
    }

    pub fn deposit_insurance(
        ctx: Context<DepositInsurance>,
        amount: u64,
    ) -> Result<()> {
        instructions::deposit_insurance::handler(ctx, amount)
    }

    pub fn file_case(
        ctx: Context<FileCase>,
        title: String,
        description: String,
    ) -> Result<()> {
        instructions::file_case::handler(ctx, title, description)
    }

    pub fn submit_evidence(
        ctx: Context<SubmitEvidence>,
        evidence_cid: String,
    ) -> Result<()> {
        instructions::submit_evidence::handler(ctx, evidence_cid)
    }

    pub fn stake_as_juror(
        ctx: Context<StakeAsJuror>,
        stake_amount: u64,
    ) -> Result<()> {
        instructions::stake_as_juror::handler(ctx, stake_amount)
    }

    pub fn select_jurors(
        ctx: Context<SelectJurors>,
        juror_count: u8,
    ) -> Result<()> {
        instructions::select_jurors::handler(ctx, juror_count)
    }

    pub fn submit_ai_analysis(
        ctx: Context<SubmitAiAnalysis>,
        analysis: String,
    ) -> Result<()> {
        instructions::submit_ai_analysis::handler(ctx, analysis)
    }

    pub fn cast_vote(
        ctx: Context<CastVote>,
        plaintiff: bool,
    ) -> Result<()> {
        instructions::cast_vote::handler(ctx, plaintiff)
    }

    pub fn enforce_verdict(
        ctx: Context<EnforceVerdict>,
    ) -> Result<()> {
        instructions::enforce_verdict::handler(ctx)
    }
}