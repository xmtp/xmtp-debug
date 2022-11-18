Simple CLI tool for inspecting data on XMTP networks.

To understand what you are inspecting please refer to https://xmtp.org/docs/dev-concepts/architectural-overview

# Installation

1. clone this repository
2. run `npm install`
3. run `npm start init`

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

For example

```
npm start contacts list xmtp.eth
```

Note that the options can also be set from environment variables prefixed with `XMTP_`, e.g.

```
$ export XMTP_ADDRESS=xmtp.eth
$ export XMPT_ENV=production
$ npm start contacts list
$ npm start intros list
$ ...
```
