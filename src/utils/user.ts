import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConfig, createKeypairFromFile } from './configs';

let user: Keypair;

/**
 * Load and parse the Solana CLI config file to determine which payer to use
 */
export const getKeypair = async () => {
    try {
        const config = await getConfig();
        if (!config.keypair_path) throw new Error('Missing keypair path');
        return await createKeypairFromFile(config.keypair_path);
    } catch (err) {
        console.warn(
            'Failed to create keypair from CLI config file, falling back to new random keypair',
        );
        return Keypair.generate();
    }
}

export const establishPayer = async (connection: Connection, size: number) => {
    let fees = 0;
    if (!user) {
        const { feeCalculator } = await connection.getRecentBlockhash();

        // Calculate the cost to fund the greeter account
        fees += await connection.getMinimumBalanceForRentExemption(size);

        // Calculate the cost of sending transactions
        fees += feeCalculator.lamportsPerSignature * 100; // wag

        user = await getKeypair();
    }

    let lamports = await connection.getBalance(user.publicKey);
    if (lamports < fees) {
        // If current balance is not enough to pay for fees, request an airdrop
        const sig = await connection.requestAirdrop(
            user.publicKey,
            fees - lamports,
        );
        await connection.confirmTransaction(sig);
        lamports = await connection.getBalance(user.publicKey);
    }

    console.log(
        'Using account',
        user.publicKey.toBase58(),
        'containing',
        lamports / LAMPORTS_PER_SOL,
        'SOL to pay for fees',
    );
}