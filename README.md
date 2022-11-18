Simple CLI tool for inspecting data on XMTP networks.

To understand what you are inspecting please refer to https://xmtp.org/docs/dev-concepts/architectural-overview.

# Installation

1. clone this repository
2. run `npm install`
3. run `npm start init`

# Usage

Run `npm start` to see help, e.g.

```
npm start <command>

Commands:
  npm start init                      initialize wallet
  npm start intros [cmd] [address]    list/check introduction messages for the
                                      address
  npm start invites [cmd] [address]   list/check introductions for the address
  npm start contacts [cmd] [address]  list/check published contacts for the
                                      address
  npm start private [address]         list published private key bundles for the
                                      address

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -e, --env      The XMTP environment to use
                        [string] [choices: "dev", "production"] [default: "dev"]
  -a, --address  wallet address to inspect                              [string]

Examples:
  npm start intros list xmtp.eth     list all introduction messages for xmtp.eth
  npm start invites list xmtp.eth    list all invitations for xmtp.eth
  npm start contacts check xmtp.eth  check all contacts of xmtp.eth for
                                     anomalies
```

Note that the options can also be set from environment variables prefixed with `XMTP_`, e.g.

```
$ export XMTP_ADDRESS=xmtp.eth
$ export XMPT_ENV=production
$ npm start contacts list
$ npm start intros list
$ ...
```
