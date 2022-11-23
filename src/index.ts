import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Client } from '@xmtp/xmtp-js'
import {
  loadWallet,
  saveRandomWallet,
  resolveAddress,
  WALLET_FILE_LOCATION,
} from './utils'
import intros from './intros'
import contacts from './contacts'
import privateKeys from './privateKeys'
import invites from './invites'

yargs(hideBin(process.argv))
  .scriptName(`npm start`)
  .command('init', 'initialize wallet', {}, async (argv: any) => {
    const { env } = argv
    saveRandomWallet()
    const client = await Client.create(loadWallet(), { env })
    console.log(
       `New wallet with address ${client.address} saved at ${WALLET_FILE_LOCATION}`
    )
  })
  .command(
    'intros [cmd] [address]',
    'list/check introduction messages for the address',
    { 
      cmd: { type: 'string', choices: ['check', 'list'], default: 'list'},
      address: { type: 'string' },
    },
    async (argv: yargs.Arguments) => {
      await intros(await resolve(argv))
    }
  )
  .example('$0 intros list xmtp.eth', 'list all introduction messages for xmtp.eth')
  .command(
    'invites [cmd] [address]',
    'list/check introductions for the address',
    { 
      cmd: { type: 'string', choices: ['check', 'list'], default: 'list'},
      address: { type: 'string' },
    },
    async (argv: any) => {
      await invites(await resolve(argv))
    }
  )
  .example('$0 invites -- --long list xmtp.eth', 'list all invitations for xmtp.eth, do not shorten addresses')
  .command(
    'contacts [cmd] [address]',
    'list/check published contacts for the address',
    { 
      cmd: { type: 'string', choices: ['check', 'list'], default: 'list'},
      address: { type: 'string' },
    },
    async (argv: any) => {
      await contacts(await resolve(argv))
    }
  )
  .example('$0 contacts -- --env=production check xmtp.eth', 'check all contacts of xmtp.eth for anomalies on the production network')
  .command(
    'private [address]',
    'list published private key bundles for the address',
    { 
      address: { type: 'string' },
    },
    async (argv: any) => {
      await privateKeys(await resolve(argv))
    }
  )
  .option('env', {
    alias: 'e',
    type: 'string',
    default: 'dev',
    choices: ['dev', 'production'] as const,
    description: 'The XMTP environment to use',
  })
  .option('address', {
    alias: 'a',
    type: 'string',
    description: 'wallet address to inspect'
  })
  .option('long', {
    alias: 'l',
    type: 'boolean',
    default: false,
    description: 'do not shorten addresses'
  })
  // all options can be passed in as env vars prefixed with XMTP_
  .env('XMTP')
  // log the network environment used
  .middleware(argv => console.log(`XMTP environment: ${argv.env}`))
  .demandCommand(1)
  .parse()

async function resolve(argv: any) {
  const { env, address } = argv
  argv.client = await Client.create(loadWallet(), { env })
  argv.address = await resolveAddress(address)
  return argv
}