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

yargs(hideBin(process.argv))
  .command('init', 'Initialize wallet', {}, async (argv: any) => {
    const { env } = argv
    saveRandomWallet()
    const client = await Client.create(loadWallet(), { env })
    console.log(
       `New wallet with address ${client.address} saved at ${WALLET_FILE_LOCATION}`
    )
  })
  .command(
    'intros <cmd> <address>',
    'list/check introduction messages for the address',
    { 
      cmd: { type: 'string', choices: ['check', 'list'], default: 'list'},
      address: { type: 'string', demand: true },
    },
    async (argv: any) => {
      const { env, cmd, address } = argv
      const client = await Client.create(loadWallet(), { env })
      await intros(client, cmd, await resolveAddress(address))
    }
  )
  .command(
    'contacts <cmd> <address>',
    'list/check published contacts for the address',
    { 
      cmd: { type: 'string', choices: ['check', 'list'], default: 'list'},
      address: { type: 'string', demand: true },
    },
    async (argv: any) => {
      const { env, cmd, address } = argv
      const client = await Client.create(loadWallet(), { env })
      await contacts(client, cmd, await resolveAddress(address))
    }
  )
  .command(
    'private <address>',
    'list published private key bundles for the address',
    { 
      address: { type: 'string', demand: true },
    },
    async (argv: any) => {
      const { env, address } = argv
      const client = await Client.create(loadWallet(), { env })
      await privateKeys(client, await resolveAddress(address))
    }
  )
  .option('env', {
    alias: 'e',
    type: 'string',
    default: 'dev',
    choices: ['dev', 'production'] as const,
    description: 'The XMTP environment to use',
  })
  .env('XMTP') // all options can be passed in as env vars prefixed with XMTP_
  .demandCommand(1)
  .parse()
