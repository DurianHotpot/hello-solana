import path from 'path';
import * as borsh from 'borsh';
import { createKeypairFromFile } from './configs';
import { connect } from './network';
import { spawn } from 'child_process';
import { Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from '@solana/web3.js';

export const getProgram = async (name: string) => {
    const keypairPath = path.join(__dirname, '../../build', `${name}-keypair.json`);

    // Read program id from keypair file
    try {
        const programKeypair = await createKeypairFromFile(keypairPath);
        const programId = programKeypair.publicKey;
        console.log(`Program found with id: ${programId}`);
        return {
            id: programId,
            execute: execute(programId),
            call
        };
    } catch (err) {
        const errMsg = (err as Error).message;
        throw new Error(
            `Failed to read program keypair at '${keypairPath}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``,
        );
    }
}

export const deploy = async (name: string) => {
    if (await compile() != 0) {
        throw 'Program failed to compile';
    }

    return new Promise((resolve, reject) => {
        const sourcePath = path.join(__dirname, '../../build', `${name}.so`);
        const child = spawn('solana', ['program', 'deploy', sourcePath]);
        let data: string = '';

        child.stdout.setEncoding('utf8').on('data', (chunk) => {
            data += chunk;
        });

        child.stderr.setEncoding('utf8').on('data', (chunk) => {
            reject(chunk);
            // data from standard output is here as buffers
        });

        child.on('close', (code) => {
            console.log(data);
            // console.log(`child process exited with code ${code}`);
            resolve(getProgram(name));
        });
    });
}

const execute = (programId: PublicKey) => async (accountKey: PublicKey, user: Keypair, data?: string) => {
    const connection = await connect();
    const instruction = new TransactionInstruction({
        keys: [{ pubkey: accountKey, isSigner: false, isWritable: true }],
        programId,
        data: data ? Buffer.alloc(data.length, data) : undefined
    });
    return await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [user],
    );
}

const call = async <T>(
    account: {
        key: PublicKey,
        classType: { new (args: any): T; },
        schema: Map<any, { kind: string; fields: (string | number[])[][]; }>,
        size: number
    }
) => {
    const connection = await connect();
    const accountInfo = await connection.getAccountInfo(account.key);
    if (accountInfo === null) {
        throw 'Error: cannot find the storage account';
    }
    
    return borsh.deserialize(
        account.schema,
        account.classType,
        accountInfo.data,
    );
}

const compile = () => new Promise((resolve, reject) => {
    const child = spawn('make', ['-C', 'contracts']);
    let data: string = '';

    child.stdout.setEncoding('utf8').on('data', (chunk) => {
        data += chunk;
    });

    child.stderr.setEncoding('utf8').on('data', (chunk) => {
        reject(chunk);
        // data from standard output is here as buffers
    });

    child.on('close', (code) => {
        console.log(data);
        // console.log(`child process exited with code ${code}`);
        resolve(code);
    });
});

