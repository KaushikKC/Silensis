/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `src/idl/mini_perps.json`.
 */
export type MiniPerps = {
  address: "AY4EDSxDQXhx5neK8ygEuZY1ogE8JkeTVjpUNSwhyJep";
  metadata: {
    name: "miniPerps";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Perpetual futures DEX on Solana";
  };
  instructions: [
    {
      name: "applyFunding";
      discriminator: [199, 170, 102, 61, 252, 86, 228, 184];
      accounts: [
        {
          name: "caller";
          writable: true;
          signer: true;
        },
        {
          name: "globalState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 101];
              },
            ];
          };
        },
        {
          name: "priceFeed";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 105, 99, 101, 95, 102, 101, 101, 100];
              },
            ];
          };
        },
      ];
      args: [];
    },
    {
      name: "closePosition";
      discriminator: [123, 134, 81, 0, 49, 68, 98, 98];
      accounts: [
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "userVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "user";
              },
            ];
          };
        },
        {
          name: "position";
          writable: true;
        },
        {
          name: "globalState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 101];
              },
            ];
          };
        },
        {
          name: "priceFeed";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 105, 99, 101, 95, 102, 101, 101, 100];
              },
            ];
          };
        },
      ];
      args: [];
    },
    {
      name: "deposit";
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182];
      accounts: [
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "userAta";
          writable: true;
        },
        {
          name: "userVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "user";
              },
            ];
          };
        },
        {
          name: "globalState";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 101];
              },
            ];
          };
        },
        {
          name: "treasury";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 114, 101, 97, 115, 117, 114, 121];
              },
            ];
          };
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "globalState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 101];
              },
            ];
          };
        },
        {
          name: "usdcMint";
        },
        {
          name: "treasury";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 114, 101, 97, 115, 117, 114, 121];
              },
            ];
          };
        },
        {
          name: "priceFeed";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 105, 99, 101, 95, 102, 101, 101, 100];
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "liquidate";
      discriminator: [223, 179, 226, 125, 48, 46, 39, 74];
      accounts: [
        {
          name: "liquidator";
          writable: true;
          signer: true;
        },
        {
          name: "liquidatorVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "liquidator";
              },
            ];
          };
        },
        {
          name: "position";
          writable: true;
        },
        {
          name: "ownerVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "position.owner";
                account: "position";
              },
            ];
          };
        },
        {
          name: "globalState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 101];
              },
            ];
          };
        },
        {
          name: "priceFeed";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 105, 99, 101, 95, 102, 101, 101, 100];
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "openPosition";
      discriminator: [135, 128, 47, 77, 15, 152, 240, 49];
      accounts: [
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "userVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "user";
              },
            ];
          };
        },
        {
          name: "position";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 115, 105, 116, 105, 111, 110];
              },
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "global_state.next_position_id";
                account: "globalState";
              },
            ];
          };
        },
        {
          name: "globalState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 101];
              },
            ];
          };
        },
        {
          name: "priceFeed";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 105, 99, 101, 95, 102, 101, 101, 100];
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "openPositionParams";
            };
          };
        },
      ];
    },
    {
      name: "setPrice";
      discriminator: [16, 19, 182, 8, 149, 83, 72, 181];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
          relations: ["globalState"];
        },
        {
          name: "globalState";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 101];
              },
            ];
          };
        },
        {
          name: "priceFeed";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 105, 99, 101, 95, 102, 101, 101, 100];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: "price";
          type: "u64";
        },
      ];
    },
    {
      name: "withdraw";
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34];
      accounts: [
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "userAta";
          writable: true;
        },
        {
          name: "userVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "user";
              },
            ];
          };
        },
        {
          name: "globalState";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 101];
              },
            ];
          };
        },
        {
          name: "treasury";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 114, 101, 97, 115, 117, 114, 121];
              },
            ];
          };
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "globalState";
      discriminator: [163, 46, 74, 168, 216, 123, 133, 98];
    },
    {
      name: "position";
      discriminator: [170, 188, 143, 228, 122, 64, 247, 208];
    },
    {
      name: "priceFeed";
      discriminator: [189, 103, 252, 23, 152, 35, 243, 156];
    },
    {
      name: "userVault";
      discriminator: [23, 76, 96, 159, 210, 10, 5, 22];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "insufficientMargin";
      msg: "Insufficient margin for this position";
    },
    {
      code: 6001;
      name: "maxLeverageExceeded";
      msg: "Maximum leverage exceeded";
    },
    {
      code: 6002;
      name: "oracleStale";
      msg: "Oracle price is stale";
    },
    {
      code: 6003;
      name: "oracleInvalidPrice";
      msg: "Oracle price is invalid";
    },
    {
      code: 6004;
      name: "positionNotLiquidatable";
      msg: "Position is not liquidatable";
    },
    {
      code: 6005;
      name: "positionNotOpen";
      msg: "Position is not open";
    },
    {
      code: 6006;
      name: "protocolPaused";
      msg: "Protocol is paused";
    },
    {
      code: 6007;
      name: "insufficientBalance";
      msg: "Insufficient balance for withdrawal";
    },
    {
      code: 6008;
      name: "mathOverflow";
      msg: "Math overflow";
    },
    {
      code: 6009;
      name: "invalidParameter";
      msg: "Invalid parameter";
    },
    {
      code: 6010;
      name: "unauthorized";
      msg: "Unauthorized access";
    },
    {
      code: 6011;
      name: "fundingIntervalNotElapsed";
      msg: "Funding interval not elapsed";
    },
    {
      code: 6012;
      name: "invalidLeverage";
      msg: "Invalid leverage value";
    },
    {
      code: 6013;
      name: "zeroSize";
      msg: "Position size must be greater than zero";
    },
    {
      code: 6014;
      name: "zeroAmount";
      msg: "Withdrawal amount must be greater than zero";
    },
  ];
  types: [
    {
      name: "direction";
      type: {
        kind: "enum";
        variants: [
          {
            name: "long";
          },
          {
            name: "short";
          },
        ];
      };
    },
    {
      name: "globalState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "usdcMint";
            type: "pubkey";
          },
          {
            name: "treasury";
            type: "pubkey";
          },
          {
            name: "totalLongOi";
            type: "u64";
          },
          {
            name: "totalShortOi";
            type: "u64";
          },
          {
            name: "lastFundingTime";
            type: "i64";
          },
          {
            name: "cumulativeFundingRateLong";
            type: "i128";
          },
          {
            name: "cumulativeFundingRateShort";
            type: "i128";
          },
          {
            name: "maxLeverage";
            type: "u64";
          },
          {
            name: "maintenanceMarginBps";
            type: "u64";
          },
          {
            name: "liquidationFeeBps";
            type: "u64";
          },
          {
            name: "nextPositionId";
            type: "u64";
          },
          {
            name: "isPaused";
            type: "bool";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "openPositionParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "direction";
            type: {
              defined: {
                name: "direction";
              };
            };
          },
          {
            name: "size";
            type: "u64";
          },
          {
            name: "leverage";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "position";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "positionId";
            type: "u64";
          },
          {
            name: "direction";
            type: {
              defined: {
                name: "direction";
              };
            };
          },
          {
            name: "size";
            type: "u64";
          },
          {
            name: "entryPrice";
            type: "u64";
          },
          {
            name: "leverage";
            type: "u64";
          },
          {
            name: "margin";
            type: "u64";
          },
          {
            name: "lastFundingTime";
            type: "i64";
          },
          {
            name: "cumulativeFunding";
            type: "i64";
          },
          {
            name: "isOpen";
            type: "bool";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "priceFeed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "price";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "userVault";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "depositedAmount";
            type: "u64";
          },
          {
            name: "lockedMargin";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
  ];
};
