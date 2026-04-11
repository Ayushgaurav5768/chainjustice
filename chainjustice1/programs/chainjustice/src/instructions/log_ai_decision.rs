use anchor_lang::prelude::*;

use crate::errors::ChainJusticeError;
use crate::state::{AiModel, MODEL_DESCRIPTION_MAX};

pub const DECISION_HASH_SIZE: usize = 32;

#[derive(Accounts)]
pub struct LogAiDecision<'info> {
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

pub fn handler(ctx: Context<LogAiDecision>, decision_hash: [u8; 32]) -> Result<()> {
	let ai_model = &mut ctx.accounts.ai_model;

	let decision_reference = format!("decision:{}", encode_hex(&decision_hash));
	let updated_description = if ai_model.description.is_empty() {
		decision_reference
	} else {
		format!("{}\n{}", ai_model.description, decision_reference)
	};

	// Keep the stored audit text within the account's bounded string capacity.
	if updated_description.is_empty() || updated_description.len() > MODEL_DESCRIPTION_MAX {
		return Err(ChainJusticeError::InvalidDescription.into());
	}

	ai_model.description = updated_description;

	Ok(())
}

fn encode_hex(bytes: &[u8; DECISION_HASH_SIZE]) -> String {
	const HEX: &[u8; 16] = b"0123456789abcdef";
	let mut encoded = String::with_capacity(DECISION_HASH_SIZE * 2);

	for byte in bytes {
		encoded.push(HEX[(byte >> 4) as usize] as char);
		encoded.push(HEX[(byte & 0x0f) as usize] as char);
	}

	encoded
}
