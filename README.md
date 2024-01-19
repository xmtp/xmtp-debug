# XMTP Debug Tool

This tool provides a command-line interface for interacting with the XMTP network, allowing users to perform various operations such as initializing wallets, listing messages, and checking contacts. Below is a list of available commands with their descriptions and usage examples.

To understand what you are inspecting please refer to https://xmtp.org/docs/dev-concepts/architectural-overview.

## Installation

To set up the XMTP Debug Tool, follow these steps:

1. Clone this repository.
2. Run `npm install` to install the necessary dependencies.
3. Run `npm start init` to initialize the tool.

## Usage

To get started, run `npm start` followed by a command to perform a specific action. For example:

```sh
npm start <command>
```

### Commands

#### `init`
Initializes a new wallet.

**Usage:**

```sh
npm start init
```

#### `intros [cmd] [address]`
List or check introduction messages for the specified address.

**Usage:**

```sh
npm start intros list xmtp.eth
npm start -- -d -l10 intros list xmtp.eth
```

#### `invites [cmd] [address]`
List or check invitations for the specified address.

**Usage:**

```sh
npm start -- --full invites list xmtp.eth
```

#### `contacts [cmd] [address]`
List or check published contacts for the specified address.

**Usage:**

```sh
npm start -- -e=production contacts check xmtp.eth
```


#### `private [address]`
List published private key bundles for the specified address.

**Usage:**

```sh
npm start private xmtp.eth
```


#### `crosscheck [address]`
Run checks on a given address for known issues.

**Usage:**

```sh
npm start -- crosscheck xmtp.eth
```

#### `fill-conversation-list [address] [numInvites] [numMessagesPerConvo]`
Fill the targeted address with conversation invites and messages.

**Usage:**

```sh
npm start -- fill-conversation-list xmtp.eth 10 1
```

### Options

- `--help`: Show help.
- `--version`: Show version number.
- `--env, -e`: Specify the XMTP environment to use (`dev` or `production`).
- `--address, -a`: Wallet address to inspect.
- `--full, -f`: Do not shorten long output items.
- `--start, -s`: Restrict output to dates on or after this date.
- `--end, -n`: Restrict output to dates before this date.
- `--limit, -l`: Restrict output to first `<limit>` entries.
- `--desc, -d`: Sort output in descending order.

### Examples

List all introduction messages for `xmtp.eth`:

```sh
npm start intros list xmtp.eth
```

List the last 10 introduction messages for `xmtp.eth` in descending order:

```sh
npm start -- -d -l10 intros list xmtp.eth
```


Check all contacts of `xmtp.eth` for anomalies on the production network:

```sh
npm start -- -e=production contacts check xmtp.eth
```


Start 10 conversations with `xmtp.eth` and send one message per conversation:

```sh
npm start -- fill-conversation-list xmtp.eth 10 1
```

Run a variety of checks on `xmtp.eth` to ensure it is not misconfigured:

```sh
npm start -- crosscheck xmtp.eth
```

### Environment Variables

Options can also be set from environment variables prefixed with `XMTP_`, for example:

```sh
export XMTP_ADDRESS=xmtp.eth
export XMTP_ENV=production
npm start contacts list
npm start intros list
```



### Example Output

Running the command below will produce an output similar to the following:



```
xmtp-debug % npm start --silent -- --env=production --end='3 weeks ago' --desc --limit=3 contacts list hi.xmtp.eth
XMTP environment: production
Resolved address: 0x194c31cAe1418D5256E8c58e0d08Aee1046C6Ed0
Ending on 2022-11-02T20:12:16.010Z
Limited to 3
┌─────────┬──────────────────────────┬──────┬─────────────┬─────────────┐
│ (index) │           date           │ type │ identityKey │   preKey    │
├─────────┼──────────────────────────┼──────┼─────────────┼─────────────┤
│    0    │ 2022-11-01T21:38:14.409Z │ 'V1' │ '044f…7b1a' │ '04d2…4f8c' │
│    1    │ 2022-10-28T18:24:13.305Z │ 'V1' │ '044f…7b1a' │ '04d2…4f8c' │
│    2    │ 2022-10-28T18:14:20.502Z │ 'V1' │ '044f…7b1a' │ '04d2…4f8c' │
└─────────┴──────────────────────────┴──────┴─────────────┴─────────────┘
```
