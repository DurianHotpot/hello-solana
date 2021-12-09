import { Connection } from '@solana/web3.js';
import { getConfig } from './configs'

let connection: Connection | undefined;

/**
 * Load and parse the Solana CLI config file to determine which RPC url to use
 */
export const getRpcUrl = async () => {
    try {
        const config = await getConfig();
        if (!config.json_rpc_url) throw new Error('Missing RPC URL');
        return config.json_rpc_url;
    } catch (err) {
        console.warn(
            'Failed to read RPC url from CLI config file, falling back to localhost',
        );
        return 'http://localhost:8899';
    }
}

export const connect = async () => {
    if(connection == undefined) {
        const rpcUrl = await getRpcUrl();
        connection = new Connection(rpcUrl, 'confirmed');
        const version = await connection.getVersion();
        console.log('Connection to cluster established:', rpcUrl, version);
    }

    return connection;
}