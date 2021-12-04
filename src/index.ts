import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as borsh from 'borsh';
import path from 'path';
import { getRpcUrl, getPayer, createKeypairFromFile } from './utils';
// import { Greeting as Storage, greetingSchema as storageSchema, greetingSize as storageSize } from './accounts/greeting';
import { Storage, storageSchema, storageSize } from './accounts/storage';

let connection: Connection;
let payer: Keypair;
// This file is created when running `solana program deploy dist/program/helloworld.so`
const PROGRAM_KEYPAIR_PATH = path.join(__dirname, '../build', 'SimpleStorage-keypair.json');
let programId: PublicKey;
let statePubKey: PublicKey;

const establishConnection = async () => {
    const rpcUrl = await getRpcUrl();
    connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
}

const establishPayer = async () => {
    let fees = 0;
    if (!payer) {
        const { feeCalculator } = await connection.getRecentBlockhash();

        // Calculate the cost to fund the greeter account
        fees += await connection.getMinimumBalanceForRentExemption(storageSize);

        // Calculate the cost of sending transactions
        fees += feeCalculator.lamportsPerSignature * 100; // wag

        payer = await getPayer();
    }

    let lamports = await connection.getBalance(payer.publicKey);
    if (lamports < fees) {
        // If current balance is not enough to pay for fees, request an airdrop
        const sig = await connection.requestAirdrop(
            payer.publicKey,
            fees - lamports,
        );
        await connection.confirmTransaction(sig);
        lamports = await connection.getBalance(payer.publicKey);
    }

    console.log(
        'Using account',
        payer.publicKey.toBase58(),
        'containing',
        lamports / LAMPORTS_PER_SOL,
        'SOL to pay for fees',
    );
}

const getProgram = async () => {
    // Read program id from keypair file
    try {
        const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
        programId = programKeypair.publicKey;
        console.log(`Program found with id: ${programId}`);
    } catch (err) {
        const errMsg = (err as Error).message;
        throw new Error(
            `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``,
        );
    }
}

const createStateAccount = async () => {
    // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
    const seed = 'v10';
    statePubKey = await PublicKey.createWithSeed(
        payer.publicKey,
        seed,
        programId,
    );
    // Check if the greeting account has already been created
    const greetedAccount = await connection.getAccountInfo(statePubKey);
    console.log(statePubKey.toBase58())
    if (greetedAccount === null) {
        console.log(
            'Creating account',
            statePubKey.toBase58(),
            'to say hello to',
        );
        const lamports = await connection.getMinimumBalanceForRentExemption(
            storageSize,
        );

        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: payer.publicKey,
                basePubkey: payer.publicKey,
                seed,
                newAccountPubkey: statePubKey,
                lamports,
                space: storageSize,
                programId,
            }),
        );
        await sendAndConfirmTransaction(connection, transaction, [payer]);
    }
}

const runTask = async () => {
    const message = 'Remind: take out the trash at 5pm';
    console.log('Saving message to', statePubKey.toBase58());
    const instruction = new TransactionInstruction({
        keys: [{ pubkey: statePubKey, isSigner: false, isWritable: true }],
        programId,
        data: Buffer.alloc(message.length, message), // All instructions are hellos
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payer],
    );
}

const callData = async () => {
    const accountInfo = await connection.getAccountInfo(statePubKey);
    if (accountInfo === null) {
        throw 'Error: cannot find the storage account';
    }

    const storage = borsh.deserialize(
        storageSchema,
        Storage,
        accountInfo.data,
    );
    const message = storage.message
        .slice(0, storageSize)
        .reduce((acc, cur) => acc + String.fromCharCode(cur), '')
        
    console.log(`Message stored in ${statePubKey.toBase58()} is:\n \"${message}\"`);
}

const main = async () => {
    console.log(storageSize);
    await establishConnection();

    await establishPayer();

    await getProgram();

    await createStateAccount();

    await runTask();
    await callData();
}

main();