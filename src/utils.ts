import { readFileSync, writeFileSync } from 'fs'
import { ethers, Wallet, utils } from 'ethers'

// Make sure this is in .gitignore
export const WALLET_FILE_LOCATION = './xmtp_wallet'

export const saveRandomWallet = () => {
  const newWallet = Wallet.createRandom()
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

export const truncateEthAddress = (address: string) => {
  const match = address.match(truncateRegex)
  if (!match) return address
  return `${match[1]}…${match[2]}`
}

export async function resolveAddress(address: string): Promise<string> {
  if (address.startsWith('0x')) {
    return utils.getAddress(address)
  }
  if (address.endsWith('.eth')) {
    const resolved = await ethers.getDefaultProvider().resolveName(address)
    if(resolved) { return resolved}
  }
  throw new Error(`Invalid address: ${address}`)
}