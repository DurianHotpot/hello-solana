import * as borsh from 'borsh';

/**
 * The state of a greeting account managed by the hello world program
 */
export class Greeting {
    counter = 0;
    constructor(fields: { counter: number } | undefined = undefined) {
        if (fields) {
            this.counter = fields.counter;
        }
    }
}

/**
 * Borsh schema definition for greeting accounts
 */
export const greetingSchema = new Map([
    [Greeting, { kind: 'struct', fields: [['counter', 'u32']] }],
]);

/**
 * The expected size of each greeting account.
 */
export const greetingSize = borsh.serialize(
    greetingSchema,
    new Greeting(),
).length;