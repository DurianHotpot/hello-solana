/**
 * @brief C-based Helloworld BPF program
 */
#include <solana_sdk.h>

uint64_t simple_storage(SolParameters *params)
{
  // sol_log_params(params);
  sol_log_array(params->data, params->data_len);

  if (params->ka_num < 1)
  {
    sol_log("Account not included in the instruction");
    return ERROR_NOT_ENOUGH_ACCOUNT_KEYS;
  }

  // Get the account
  SolAccountInfo *storage = &params->ka[0];

  // The account must be owned by the program in order to modify its data
  if (!SolPubkey_same(storage->owner, params->program_id))
  {
    sol_log("Account does not have the correct program id");
    return ERROR_INCORRECT_PROGRAM_ID;
  }

  // The data must be large enough to hold an uint32_t value
  // if (storage->data_len < sizeof(uint32_t))
  // {
  //   sol_log("Account data length too small to hold uint32_t value");
  //   return ERROR_INVALID_ACCOUNT_DATA;
  // }
  
  for(int i = 0; i < params->data_len; i++) {
    *(storage->data + i) = *(params->data + i);
  }

  sol_log("Value has been updated!");
  sol_log_array(storage->data, storage->data_len);
  return SUCCESS;
}

extern uint64_t entrypoint(const uint8_t *input)
{
  sol_log("Simple Storage entrypoint");

  SolAccountInfo accounts[1];
  SolParameters params = (SolParameters){.ka = accounts};

  if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts)))
  {
    return ERROR_INVALID_ARGUMENT;
  }

  return simple_storage(&params);
}
