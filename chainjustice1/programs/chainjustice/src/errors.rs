use anchor_lang::prelude::*;

#[error_code]
pub enum ChainJusticeError {
    #[msg("Invalid model name: must be non-empty and under 100 characters")]
    InvalidModelName,

    #[msg("Invalid description: must be non-empty and under 500 characters")]
    InvalidDescription,

    #[msg("Insufficient deposit: insurance deposit must be greater than zero")]
    InsufficientDeposit,

    #[msg("Unauthorized: caller is not the owner of this resource")]
    Unauthorized,

    #[msg("Case not open: this case is not accepting new submissions")]
    CaseNotOpen,

    #[msg("Invalid evidence: evidence CID must be a valid IPFS hash under 59 characters")]
    InvalidEvidence,

    #[msg("Duplicate vote: this juror has already voted on this case")]
    DuplicateVote,

    #[msg("Invalid juror: juror account does not match expected parameters")]
    InvalidJuror,

    #[msg("Case already resolved: cannot modify a closed or appealed case")]
    CaseAlreadyResolved,

    #[msg("Math overflow: numeric operation resulted in overflow")]
    MathOverflow,
}
