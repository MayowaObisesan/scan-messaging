use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

declare_id!("Fpzs4jNVnEV6seL2LGgmgiACSBbbuo5iyKJCBD7CEUZo");

#[program]
pub mod chat_app {
    use super::*;

    // Register a user
    pub fn register_user(ctx: Context<RegisterUser>, username: String) -> Result<()> {
        let user = &mut ctx.accounts.user_account;
        user.username = username;
        user.authority = ctx.accounts.authority.key();
        // user.bump = *ctx.bumps.get("user_account").unwrap();
        user.bump = ctx.bumps.user_account;
        Ok(())
    }

    // Initialize a conversation
    pub fn initialize_conversation(ctx: Context<InitializeConversation>) -> Result<()> {
        let conversation = &mut ctx.accounts.conversation_account;
        let _participant_a = ctx.accounts.participant_a.key();
        let _participant_b = ctx.accounts.participant_b.key();
        let (key1, key2) = if _participant_a < _participant_b {
            (_participant_a, _participant_b)
        } else {
            (_participant_b, _participant_a)
        };
        conversation.participant_a = key1;
        conversation.participant_b = key2;
        // conversation.bump = *ctx.bumps.get("conversation_account").unwrap();
        conversation.bump = ctx.bumps.conversation_account;
        conversation.message_count = 0;
        // conversation.participant_hash = hash_keys(_participant_a, _participant_b);
        // conversation.participant_hash = participant_hash;
        msg!(
            "Hash On-Chain?? {:?}",
            hash_keys(_participant_a, _participant_b)
        );
        Ok(())
    }

    // Send a message
    pub fn send_message(ctx: Context<SendMessage>, content: String) -> Result<()> {
        let conversation = &mut ctx.accounts.conversation_account;
        require!(content.len() <= 280, ChatAppError::MessageTooLong);

        let new_message = Message {
            sender: ctx.accounts.sender.key(),
            content,
            timestamp: Clock::get()?.unix_timestamp,
        };

        conversation.messages.push(new_message);
        conversation.message_count += 1;
        Ok(())
    }
}

// Error handling
#[error_code]
pub enum ChatAppError {
    #[msg("Message is too long.")]
    MessageTooLong,
}

// Data structures
#[account]
pub struct UserAccount {
    pub username: String,
    pub authority: Pubkey,
    pub bump: u8,
}

#[account]
pub struct ConversationAccount {
    pub participant_a: Pubkey,
    pub participant_b: Pubkey,
    pub bump: u8,
    pub message_count: u32,
    pub messages: Vec<Message>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Message {
    pub sender: Pubkey,
    pub content: String,
    pub timestamp: i64,
}

// Contexts
#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"user", authority.key().as_ref()],
        bump,
        space = 8 + 32 + 32 + 4 + 64, // Size for UserAccount
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// #[instruction(participant_hash: [u8; 32])]
// #[instruction(users_concat: Vec<u8>)]
#[derive(Accounts)]
pub struct InitializeConversation<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"conversation", participant_a.key().as_ref(), participant_b.key().as_ref()],
        bump,
        space = 8 + 32 + 32 + 1 + 4 + (4 + 280) * 10, // Size for ConversationAccount
    )]
    pub conversation_account: Account<'info, ConversationAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Safe because it's validated programmatically
    pub participant_a: AccountInfo<'info>,
    /// CHECK: Safe because it's validated programmatically
    pub participant_b: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

/*
impl<'info> InitializeConversation<'info> {
    pub const MAX_MESSAGES: usize = 10; // Limit messages to prevent oversized accounts
    pub const MAX_SIZE: usize = 32 + // participant_a
            32 + // participant_b
            1 +  // bump
            4 + Self::MAX_MESSAGES * (32 + 4 + 280); // Vec<Message>: sender + timestamp + content

    pub fn hash_keys_user(key1: Pubkey, key2: Pubkey) -> [u8; 32] {
        // Order keys deterministically
        let (key1, key2) = if key1 < key2 {
            (key1, key2)
        } else {
            (key2, key1)
        };

        // Hash the concatenated keys
        let mut hasher = Sha256::new();
        hasher.update(key1.as_ref());
        hasher.update(key2.as_ref());

        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }

    // pub fn hash_user_keys(&self) -> [u8; 32] {
    //     // Order keys deterministically
    //     let (key1, key2) = if self.participant_a < self.participant_b {
    //         (self.participant_a, self.participant_b)
    //     } else {
    //         (self.participant_b, self.participant_a)
    //     };
    //
    //     // Hash the concatenated keys
    //     let mut hasher = Sha256::new();
    //     hasher.update(key1.as_ref());
    //     hasher.update(key2.as_ref());
    //
    //     let result = hasher.finalize();
    //     let mut hash = [0u8; 32];
    //     hash.copy_from_slice(&result);
    //     hash
    // }
}
*/

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(mut)]
    pub conversation_account: Account<'info, ConversationAccount>,
    pub sender: Signer<'info>,
}

pub fn hash_keys(key1: Pubkey, key2: Pubkey) -> [u8; 32] {
    // Order keys deterministically
    let (key1, key2) = if key1 < key2 {
        (key1, key2)
    } else {
        (key2, key1)
    };

    // Hash the concatenated keys
    let mut hasher = Sha256::new();
    hasher.update(key1.as_ref());
    hasher.update(key2.as_ref());

    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}

// use anchor_lang::prelude::*;
//
// declare_id!("JBzRZPJmE6B8yDvRy9bGbtEAkseiDKEUumFbDDSkZ2wg");
//
// #[program]
// pub mod chat_app {
//     use super::*;
//
//     pub fn initialize_conversation(
//         ctx: Context<InitializeConversation>,
//         bump: u8,
//     ) -> Result<()> {
//         let conversation_account = &mut ctx.accounts.conversation_account;
//         conversation_account.participant_a = *ctx.accounts.participant_a.key;
//         conversation_account.participant_b = *ctx.accounts.participant_b.key;
//         // conversation_account.owner = *ctx.accounts.owner.key;
//         // conversation_account.creation_time = ctx.accounts.creation_time;
//         conversation_account.bump = bump;
//         conversation_account.message_count = 0;
//         conversation_account.messages = Vec::new();
//
//         msg!("Greetings from: {:?}", ctx.program_id);
//         Ok(())
//     }
//
//     pub fn send_message(ctx: Context<SendMessage>, content: String) -> Result<()> {
//         let conversation_account = &mut ctx.accounts.conversation_account;
//
//         // Explicit check to ensure that the sender is a participant
//         require!(
//             ctx.accounts.sender.key() == conversation_account.participant_a
//                 || ctx.accounts.sender.key() == conversation_account.participant_b,
//             ErrorCode::Unauthorized
//         );
//
//         // Ensure the message is not too long
//         require!(content.len() <= 280, ErrorCode::MessageTooLong);
//
//         // Add the message to the conversation
//         let new_message = Message {
//             sender: *ctx.accounts.sender.key,
//             content,
//             timestamp: Clock::get()?.unix_timestamp,
//         };
//
//         conversation_account.messages.push(new_message);
//         conversation_account.message_count += 1;
//         Ok(())
//     }
// }
//
// #[derive(Accounts)]
// #[instruction(bump: u8)]
// pub struct InitializeConversation<'info> {
//     #[account(
//         init,
//         payer=participant_a,
//         seeds = [
//             b"conversation",
//             participant_a.key().as_ref(),
//             participant_b.key().as_ref()
//         ],
//         bump,
//         space=8 + ConversationAccount::MAX_SIZE,
//     )]
//     pub conversation_account: Account<'info, ConversationAccount>,
//     #[account(mut)]
//     pub participant_a: Signer<'info>,
//     /// CHECK: Safe because it's validated programmatically
//     pub participant_b: AccountInfo<'info>,
//     pub system_program: Program<'info, System>,
// }
//
// #[derive(Accounts)]
// pub struct SendMessage<'info> {
//     #[account(
//         mut,
//         seeds = [
//             b"conversation",
//             conversation_account.participant_a.as_ref(),
//             conversation_account.participant_a.as_ref()
//         ],
//         bump = conversation_account.bump,
//     )]
//     pub conversation_account: Account<'info, ConversationAccount>,
//     pub sender: Signer<'info>,
// }
//
// #[account]
// pub struct ConversationAccount {
//     pub participant_a: Pubkey,
//     pub participant_b: Pubkey,
//     pub message_count: u64,
//     pub bump: u8,
//     pub messages: Vec<Message>,
// }
//
// impl ConversationAccount {
//     pub const MAX_MESSAGES: usize = 10; // Limit messages to prevent oversized accounts
//     pub const MAX_SIZE: usize = 32 + // participant_a
//             32 + // participant_b
//             1 +  // bump
//             4 + Self::MAX_MESSAGES * (32 + 4 + 280); // Vec<Message>: sender + timestamp + content
// }
//
// #[derive(Clone, AnchorDeserialize, AnchorSerialize)]
// pub struct Message {
//     pub sender: Pubkey,
//     pub content: String,
//     pub timestamp: i64,
// }
//
// #[error_code]
// pub enum ErrorCode {
//     #[msg("You are not the owner")]
//     NotOwner,
//     #[msg("You already initialized")]
//     AlreadyInitialized,
//     #[msg("Message too long")]
//     MessageTooLong,
//     #[msg("The sender is not a participant in this conversation.")]
//     Unauthorized,
//     #[msg("The sender does not belong to the conversation.")]
//     UnauthorizedSender,
// }
