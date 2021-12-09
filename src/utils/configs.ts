import os from 'os';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { promisify } from 'util';
import { Keypair } from '@solana/web3.js';

const readFile = promisify(fs.readFile)

/**
 * Create a Keypair from a secret key stored in file as bytes' array
 */
export const createKeypairFromFile = async (filePath: string) => {
    const secretKeyString = await readFile(filePath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey);
}

export const getConfig = async () => {
    // Path to Solana CLI config file
    const CONFIG_FILE_PATH = path.resolve(
        os.homedir(),
        '.config',
        'solana',
        'cli',
        'config.yml',
    );
    const configYml = await readFile(CONFIG_FILE_PATH, { encoding: 'utf8' });
    return yaml.parse(configYml);
}
