import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {ChatApp} from "../target/types/chat_app";
import {expect} from "chai";

describe("chat_app", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.ChatApp as Program<ChatApp>;
    // const userA = anchor.web3.Keypair.generate();
    // const userB = anchor.web3.Keypair.generate();
    // const authority = anchor.web3.Keypair.generate();
    // console.log(userA, userB, authority);

    const userBSecretKey = [177, 146, 82, 92, 76, 9, 233, 128, 67, 249, 227,
        11, 35, 171, 27, 12, 100, 167, 7, 240, 73, 147,
        186, 19, 135, 102, 133, 57, 229, 107, 29, 111, 206,
        20, 202, 203, 77, 111, 229, 112, 178, 12, 44, 159,
        89, 245, 203, 59, 174, 24, 165, 137, 3, 213, 14,
        164, 38, 201, 84, 9, 80, 69, 91, 125
    ]
    const userASecretKey = [154, 245, 121, 174, 156, 124, 169, 47, 25, 10, 1,
        2, 31, 171, 102, 16, 26, 103, 246, 80, 113, 167,
        240, 11, 18, 248, 202, 77, 241, 18, 212, 75, 4,
        64, 59, 168, 67, 70, 185, 77, 172, 192, 154, 31,
        228, 62, 52, 161, 125, 2, 89, 46, 31, 216, 194,
        10, 7, 30, 125, 171, 122, 118, 11, 143
    ]
    const authoritySecretKey = [246, 156, 55, 108, 110, 36, 82, 77, 30, 77, 95,
        107, 212, 156, 174, 25, 95, 244, 206, 52, 129, 169,
        120, 40, 206, 44, 220, 41, 78, 15, 188, 192, 111,
        86, 107, 95, 147, 49, 11, 30, 63, 158, 220, 214,
        242, 110, 44, 165, 101, 239, 237, 66, 27, 222, 216,
        167, 117, 52, 161, 214, 38, 181, 124, 20]

    const userA = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(userASecretKey))
    const userB = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(userBSecretKey))
    const authorityUser = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(authoritySecretKey))

    /*function hashKeys(): Buffer {
        // Deterministically order the keys
        const [key1, key2] = [userA.publicKey, userB.publicKey].sort((a, b) =>
            a.toBase58().localeCompare(b.toBase58())
        );

        // Hash the keys
        const hasher = crypto.createHash("sha256");
        hasher.update(key1.toBuffer());
        hasher.update(key2.toBuffer());
        const hash = hasher.digest();
        console.log("Hashhh", Buffer.from(hash));
        return Buffer.from(hash);
    }*/

    const [key1, key2] = [userA.publicKey, userB.publicKey].sort((a, b) =>
        a.toBase58().localeCompare(b.toBase58())
    );
    /*console.log("sorted users", key1, key2);
    console.log("unsorted users", userA.publicKey, userB.publicKey);
    console.log("program Id", program.programId);*/

    // const participantHash = hashKeys();

    let userAPda;
    let conversationPda;
    let conversationBump: number;

    // it("Airdrops SOL to User A and User B", async () => {
    //     // console.log(provider.connection)
    //     // Airdrop SOL to userA and userB
    //     const res = await provider.connection.requestAirdrop(authority.publicKey, 10000000000); // 10 SOL to authority
    //     await provider.connection.requestAirdrop(userB.publicKey, 10000000000); // 10 SOL to userB
    //     await provider.connection.requestAirdrop(userA.publicKey, 10000000000); // 10 SOL to userA
    //     console.log("airdrop authority", res)
    //     await provider.connection.confirmTransaction(res, "confirmed");
    //
    //     // Confirm that the airdrop was successful
    //     const balanceA = await provider.connection.getBalance(userA.publicKey, "confirmed");
    //     const balanceB = await provider.connection.getBalance(userB.publicKey);
    //
    //     console.log("User A balance after airdrop:", balanceA);
    //     console.log("User B balance after airdrop:", balanceB);
    //
    //     expect(balanceA).to.be.greaterThan(0); // Check if userA received SOL
    //     expect(balanceB).to.be.greaterThan(0); // Check if userB received SOL
    // });

    it("Registers User A", async () => {
        // Derive User PDA
        [userAPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("user"), userA.publicKey.toBuffer()],
            program.programId
        );

        // Register User A
        await program.methods
            .registerUser("Alice")
            .accounts({
                // @ts-ignore
                userAccount: userAPda,
                authority: userA.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([userA])
            .rpc();

        // Fetch and verify User A's account
        const userAccount = await program.account.userAccount.fetch(userAPda);
        expect(userAccount.username).to.equal("Alice");
        expect(userAccount.authority.toBase58()).to.equal(userA.publicKey.toBase58());
    });

    it("Initializes a conversation between User A and User B", async () => {
        // Derive Conversation PDA
        [conversationPda, conversationBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("conversation"),
                key1.toBuffer(),
                key2.toBuffer(),
            ],
            program.programId
        );
        // userA.publicKey.toBuffer(),
        // userB.publicKey.toBuffer(),

        // Initialize Conversation
        const _pr = program.methods
            .initializeConversation()
            .accounts({
                // @ts-ignore
                conversationAccount: conversationPda,
                authority: authorityUser.publicKey,
                participantA: key1,
                participantB: key2,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([authorityUser])

        // console.log(_pr)
        console.log("Before pr")
        await _pr.rpc();
        console.log("After pr")

        // Fetch and verify the Conversation Account
        const conversationAccount = await program.account.conversationAccount.fetch(conversationPda);
        expect(conversationAccount.participantA.toBase58()).to.equal(userA.publicKey.toBase58());
        expect(conversationAccount.participantB.toBase58()).to.equal(userB.publicKey.toBase58());
        expect(conversationAccount.messageCount).to.equal(0);
    });

    it("Sends a message in the conversation", async () => {
        const messageContent = "Hello, Bob!";

        // Send a message
        await program.methods
            .sendMessage(messageContent)
            .accounts({
                conversationAccount: conversationPda,
                sender: userA.publicKey,
            })
            .signers([userA])
            .rpc();

        // Fetch and verify the Conversation Account
        const conversationAccount = await program.account.conversationAccount.fetch(conversationPda);
        expect(conversationAccount.messageCount).to.equal(1);
        expect(conversationAccount.messages[0].sender.toBase58()).to.equal(userA.publicKey.toBase58());
        expect(conversationAccount.messages[0].content).to.equal(messageContent);
    });

    it("Rejects unauthorized sender from sending a message", async () => {
        const invalidMessageContent = "This should fail.";

        try {
            await program.methods
                .sendMessage(invalidMessageContent)
                .accounts({
                    conversationAccount: conversationPda,
                    sender: userB.publicKey, // Unauthorized sender
                })
                .signers([userB])
                .rpc();
            // @ts-ignore
            throw new Error("Unauthorized sender was able to send a message!");
        } catch (error) {
            // Expecting an Anchor error
            console.log(error.message);
            // expect(error.message).to.include("AnchorError caused by account: conversation_account");
            expect(error.message).to.include("Unauthorized sender was able to send a message!");
        }
    });
});


// import * as anchor from "@coral-xyz/anchor";
// import {Program} from "@coral-xyz/anchor";
// import {ChatApp} from "../target/types/chat_app";
// import * as assert from "assert";
// import {PublicKey} from "@solana/web3.js"
//
// describe("chat_app", () => {
//     // Configure the client to use the local cluster.
//     anchor.setProvider(anchor.AnchorProvider.env());
//
//     const program = anchor.workspace.ChatApp as Program<ChatApp>;
//
//     // let conversationAccount = anchor.web3.Keypair.generate();
//     const participantA = program.provider.publicKey;
//     const participantB = anchor.web3.Keypair.generate();
//     let conversationPDA: PublicKey;
//     let bump: number;
//
//     // Utility: Derive PDA for conversation
//     async function getConversationPDA(participantA: PublicKey, participantB: PublicKey) {
//         const [pda, _bump] = PublicKey.findProgramAddressSync(
//             [Buffer.from("conversation"), participantA.toBuffer(), participantB.toBuffer()],
//             program.programId
//         );
//
//         return { pda, bump: _bump };
//     }
//
//     // it("Is initialized!", async () => {
//     //     // Add your test here.
//     //     const tx = await program.methods.initialize().rpc();
//     //     console.log("Your transaction signature", tx);
//     // });
//
//     it("Initializes a conversation", async () => {
//         // Derive the PDA
//         const {pda, bump: derivedBump} = await getConversationPDA(participantA, participantB.publicKey);
//         conversationPDA = pda;
//         bump = derivedBump;
//
//         // Send the transaction
//         // const tx = await program.methods
//         //     .initializeConversation(bump)
//         //     .accounts({
//         //         conversationAccount: conversationPDA,
//         //         participantA: participantA,
//         //         participantB: participantB.publicKey,
//         //         systemProgram: anchor.web3.SystemProgram.programId,
//         //     })
//         //     // .signers([conversationAccount])
//         //     .rpc();
//
//         // console.log(anchor.web3.SystemProgram.programId)
//         // console.log("Transaction Signature: ", tx);
//
//         // Fetch the conversation Account
//         // const account = await program.account.conversationAccount.fetch(conversationPDA);
//         // assert.strictEqual(account.participantA.toBase58(), program.provider.publicKey.toBase58());
//         // assert.strictEqual(account.participantB.toBase58(), participantB.publicKey.toBase58());
//         // assert.strictEqual(account.messageCount.toString(), "0");
//         // assert.equal(account.bump, bump)
//
//         try {
//             const tx = await program.methods
//                 .initializeConversation(bump)
//                 .accounts({
//                     conversationAccount: conversationPDA,
//                     participantA: participantA,
//                     participantB: participantB.publicKey,
//                     systemProgram: anchor.web3.SystemProgram.programId,
//                 })
//                 .rpc();
//
//             console.log("Transaction Signature:", tx);
//         } catch (err) {
//             console.error("Error occurred:", err);
//             if ("logs" in err) {
//                 console.error("Logs:", err.logs);
//             }
//         }
//     });
//
//     it("Sends a message", async () => {
//         const messageContent = "Hey, how are you?";
//
//         const tx = await program
//             .methods
//             .sendMessage(messageContent)
//             .accounts({
//                 conversationAccount: conversationPDA,
//                 sender: program.provider.publicKey,
//             })
//             .rpc();
//
//         console.log("Transaction Signature: ", tx);
//
//         const account = await program.account.conversationAccount.fetch(conversationPDA);
//         assert.strictEqual(account.messageCount.toString(), "1");
//         assert.strictEqual(account.participantA.toBase58(), program.provider.publicKey.toBase58());
//         assert.strictEqual(account.messages[0].content, messageContent);
//         assert.ok(account.messages[0].timestamp > 0);
//     });
//
//     it("Rejects unauthorized sender from sending a message", async () => {
//         const messageContent = "Unauthorized Message";
//
//         try {
//             await program.methods
//                 .sendMessage(messageContent)
//                 .accounts({
//                     conversationAccount: conversationPDA,
//                     sender: participantB.publicKey,
//                 })
//                 .signers([participantB]) // Participant B signs the transaction
//                 .rpc();
//             assert.fail("Unauthorized sender should not be allowed to send a message");
//         } catch (err) {
//             assert.equal(err.error.errorCode.code, "UnauthorizedSender");
//         }
//     });
// });
