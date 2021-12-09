import * as borsh from 'borsh';

export class Storage {
    message = new Array(128);
    constructor(fields: Storage | undefined = undefined) {
        if (fields) {
            this.message = fields.message;
        }
    }
}

export const storageSchema = new Map([
    [Storage, { kind: 'struct', fields: [['message', [128]]] }],
]);

export const storageSize = borsh.serialize(
    storageSchema,
    new Storage(),
).length;