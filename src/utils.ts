import { readFileSync, writeFileSync } from 'fs'
import { ethers, Wallet, utils } from 'ethers'
import * as crypto from 'node:crypto'
import { ListMessagesOptions, ListMessagesPaginatedOptions, PrivateKey, SortDirection } from '@xmtp/xmtp-js'
import * as secp from '@noble/secp256k1'
// @ts-ignore
import parser from 'any-date-parser'

// Make sure this is in .gitignore
export const WALLET_FILE_LOCATION = './xmtp_wallet'

export const randomWallet = (): Wallet => {
  return Wallet.createRandom()
}

export const saveRandomWallet = () => {
  const newWallet = randomWallet()
  writeFileSync(WALLET_FILE_LOCATION, newWallet.mnemonic.phrase)
}
export const loadWallet = () => {
  try {
    const existing = readFileSync(WALLET_FILE_LOCATION)
    return Wallet.fromMnemonic(existing.toString())
  } catch (e) {
    throw new Error('No wallet file found')
  }
}

const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/

export const truncateEthAddress = (address: string, shouldTruncate = true) => {
  if (!shouldTruncate) return address
  const match = address.match(truncateRegex)
  if (!match) return address
  return `${match[1]}…${match[2]}`
}

export async function resolveAddress(address: string): Promise<string> {
  if (!address) {
    throw new Error(`missing address`)
  }
  if (address.startsWith('0x')) {
    return resolvedAddress(utils.getAddress(address))
  }
  if (address.endsWith('.eth')) {
    const resolved =
      await new ethers.providers.CloudflareProvider().resolveName(address)
    if (resolved) {
      return resolvedAddress(resolved)
    }
  }
  throw new Error(`Invalid address: ${address}`)
}

function resolvedAddress(address: string): string {
  console.log(`Resolved address: ${address}`)
  return address
}

export function toListOptions(argv: any) {
  const shouldLog = argv.cmd != "load"
  const options: ListMessagesOptions = {
    direction: argv.desc
      ? SortDirection.SORT_DIRECTION_DESCENDING
      : SortDirection.SORT_DIRECTION_ASCENDING,
  }
  if (argv.start) {
    options.startTime = parseDate(argv.start, shouldLog ? 'Starting on' : undefined)
  }
  if (argv.end) {
    options.endTime = parseDate(argv.end, shouldLog ? 'Ending on' : undefined)
  }
  if (argv.limit) {
    if (shouldLog) console.log(`Limited to ${argv.limit}`)
    options.limit = argv.limit
  }
  return options
}

export function toPaginatedListOptions(argv: any) {
  const shouldLog = argv.cmd != "load"
  const options: ListMessagesPaginatedOptions = {
    direction: argv.desc
      ? SortDirection.SORT_DIRECTION_DESCENDING
      : SortDirection.SORT_DIRECTION_ASCENDING,
  }
  if (argv.start) {
    options.startTime = parseDate(argv.start, shouldLog ? 'Starting on' : undefined)
  }
  if (argv.end) {
    options.endTime = parseDate(argv.end, shouldLog ? 'Ending on' : undefined)
  }
  if (argv.page) {
    if (shouldLog) console.log(`Paging by ${argv.page}`)
    options.pageSize = argv.page
  }
  return options
}

function parseDate(input: string, msg?: string) {
  const parsed = parser.fromString(input)
  if (msg) console.log(msg, parsed)
  return parsed instanceof Date ? parsed : undefined
}

export function bytesToHex(bytes: Uint8Array) {
  return secp.utils.bytesToHex(bytes)
}

export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
}

export function chunkArray<T>(
  arr: Array<T>,
  chunkSize: number
): Array<Array<T>> {
  const out = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize)
    out.push(chunk)
  }
  return out
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
