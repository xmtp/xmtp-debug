Simple CLI tool for inspecting data on XMTP networks.

# Installation

1. clone this repository
2. run `npm install`

# Usage

Run `npm start` to see help, e.g.

```
index.js <command>

Commands:
  index.js init                     Initialize wallet
  index.js intros [cmd] [address]   list/check introduction messages for the
                                    address
  index.js contacts [cmd][address]  list/check published contacts for the
                                    address
  index.js private [address]        list published private key bundles for the
                                    address

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -e, --env      The XMTP environment to use
                        [string] [choices: "dev", "production"] [default: "dev"]
  -a, --address  wallet address to inspect                              [string]
```

Note that the options can also be set from environment variables prefixes with `XMTP_`, e.g.

```
XMTP_ADDRESS=0x.... npm start contacts list
```