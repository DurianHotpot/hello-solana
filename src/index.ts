import { deploy, getProgram } from './utils/program';
import { getKeypair } from './utils/user';
import { createAccount, getAccountKey } from './utils/account';
import { Storage, storageSchema, storageSize } from './accounts/storage';

const CONTRACT_NAME = 'SimpleStorage'
const ACCOUNT_NAME = 'storageV1'

const main = async () => {
    // await deploy(CONTRACT_NAME);
    const userKeyPair = await getKeypair();
    const program = await getProgram(CONTRACT_NAME);

    // const accountKey = await createAccount(ACCOUNT_NAME, program.id, userKeyPair, storageSize);
    // program.execute(accountKey, userKeyPair, 'Hi I\'m Michael!');

    const accountKey = await getAccountKey(ACCOUNT_NAME, program.id, userKeyPair, storageSize);
    const storage = await program.call({
        key: accountKey,
        schema: storageSchema,
        classType: Storage,
        size: storageSize
    });

    const message = storage.message
        .slice(0, storageSize)
        .reduce((acc, cur) => acc + String.fromCharCode(cur), '')

    console.log(`Message stored in ${accountKey.toBase58()} is:\n \"${message}\"`);
};

main();