import {
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    Connection,
    Keypair,
} from '@solana/web3.js';
import { connect } from './network';

export const getAccountKey = async (name: string, programId: PublicKey, user: Keypair, size: number) =>
    await PublicKey.createWithSeed(
        user.publicKey,
        name,
        programId,
    );

export const createAccount = async (name: string, programId: PublicKey, user: Keypair, size: number) => {
    const connection = await connect();
    // Check if the greeting account has already been created
    const accountKey = await getAccountKey(name, programId, user, size);
    const accountInfo = await connection.getAccountInfo(accountKey);
    // console.log(accountKey.toBase58())
    if (accountInfo === null) {
        console.log(`Creating account ${accountKey.toBase58()}`);
        const lamports = await connection.getMinimumBalanceForRentExemption(
            size,
        );

        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: user.publicKey,
                basePubkey: user.publicKey,
                seed: name,
                newAccountPubkey: accountKey,
                lamports,
                space: size,
                programId,
            }),
        );
        await sendAndConfirmTransaction(connection, transaction, [user]);
        return accountKey;
    }

    return accountKey;
}