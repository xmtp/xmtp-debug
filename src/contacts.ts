import { SignedPublicKeyBundle, PublicKeyBundle } from '@xmtp/xmtp-js'
import {
  buildUserContactTopic,
  nsToDate,
  // @ts-ignore
} from '@xmtp/xmtp-js/dist/cjs/src/utils'
// @ts-ignore
import { decodeContactBundle } from '@xmtp/xmtp-js/dist/cjs/src/ContactBundle'
// @ts-ignore
import { bytesToHex } from '@xmtp/xmtp-js/dist/cjs/src/crypto/utils'
import Long from 'long'
import { fetcher } from '@xmtp/proto'
import { toListOptions } from './utils'
const { b64Decode } = fetcher
import {
  verifyIdentityKeyV1,
  verifyIdentityKeySignatureV1,
  verifyPreKeyV1,
} from './verify_utils'

type Contact = {
  timestamp: Date
  contact: PublicKeyBundle | SignedPublicKeyBundle
}

export default async function contacts(argv: any) {
  const { client, cmd, address, long } = argv
  const contacts = await client.listEnvelopes(
    buildUserContactTopic(address),
    async (env: any) => {
      if (!env.message) {
        throw new Error('No message')
      }
      return {
        timestamp: nsToDate(Long.fromString(env.timestampNs as string)),
        contact: decodeContactBundle(
          b64Decode(env.message as unknown as string)
        ),
      }
    },
    toListOptions(argv)
  )
  switch (cmd) {
    case 'list':
      await list(contacts, !long)
      break
    case 'check':
      await check(contacts)
      break
    case 'dump':
      await dump(contacts)
      break
    case 'verify':
      await verify(address, contacts)
      break
    default:
      console.log(`invalid command ${cmd}`)
  }
}

async function list(contacts: Contact[], shouldTruncate = true) {
  let rows = []
  for (const { timestamp, contact } of contacts) {
    const type =
      contact instanceof PublicKeyBundle
        ? 'V1'
        : contact instanceof SignedPublicKeyBundle
        ? 'V2'
        : typeof contact
    const identityKey = bytesToHex(
      contact.identityKey.secp256k1Uncompressed.bytes
    )
    const preKey = bytesToHex(contact.preKey.secp256k1Uncompressed.bytes)
    rows.push({
      date: timestamp,
      type: type,
      identityKey: truncateHex(identityKey, shouldTruncate),
      preKey: truncateHex(preKey, shouldTruncate),
    })
  }
  console.table(rows)
}

async function check(contacts: Contact[]) {
  let lastContact: Contact | null = null
  let numMismatched = 0
  let numContacts = 0
  for (const contact of contacts) {
    numContacts++
    if (lastContact && !equal(lastContact, contact)) {
      console.log('Contact changed', contact.timestamp)
      numMismatched++
    }
    lastContact = contact
  }
  console.log(
    `Number of contacts: ${numContacts}. Mismatched: ${numMismatched}`
  )
}

async function dump(contacts: Contact[]) {
  for (const contact of contacts) {
    console.dir(contact, { depth: 4 })
  }
}

/**
 * Checks several invariants of each contact bundle:
 * - If v1:
 *   - Identity key is a valid secp256k1 uncompressed public key
 *   - Pre key is a valid secp256k1 uncompressed public key
 *   - IdentityKey is a PublicKey with a signature, the signature has .ecdsaCompact
 *     - The .ecdsaCompact is a valid secp256k1 signature that recovers to the correct address
 *   - PreKey is a PublicKey with a signature, the signature has .ecdsaCompact
 *     - The .ecdsaCompact is a valid secp256k1 signature that recovers to the identity key
 * - If v2: (TODO)
 * @param contacts
 */
async function verify(address: string, contacts: Contact[]) {
  // Rows is a list of [date, type, identityKey, preKey, concatenated invariant checks]
  let rows = []
  for (const { timestamp, contact } of contacts) {
    // V1 - check codes are:
    // - idkey_bad - identity key is not valid secp256k1 uncompressed
    // - prekey_bad - pre key is not valid secp256k1 uncompressed
    // - idkey_sig_missing - identity key is not a PublicKey with a signature
    // - idkey_wrong_sig_type - identity key signature has walletEcdsaCompact instead of ecdsaCompact
    // - prekey_sig_missing - pre key is not a PublicKey with a signature
    // - prekey_wrong_sig_type - pre key signature has walletEcdsaCompact instead of ecdsaCompact
    // - idkey_sig_bad - identity key signature is not a valid secp256k1 signature (recovers to wrong address)
    // - prekey_sig_bad - pre key signature is not a valid secp256k1 signature (not signed by this idkey)
    let errors = []
    if (contact instanceof PublicKeyBundle) {
      const { identityKey, preKey } = contact
      let idKeyErrors = verifyIdentityKeyV1(contact)
      errors.push(...idKeyErrors)
      let idkeySigErrors = verifyIdentityKeySignatureV1(contact)
      errors.push(...idkeySigErrors)
      let preKeyErrors = verifyPreKeyV1(contact)
      errors.push(...preKeyErrors)

      let joinedErrors = errors.join(',')
      rows.push({
        date: timestamp,
        type: contact instanceof PublicKeyBundle ? 'v1' : 'v2',
        errors: joinedErrors.length > 0 ? joinedErrors : 'ok',
      })
    }
  }
  console.table(rows)
}

function equal(a: Contact, b: Contact): boolean {
  return a.contact instanceof PublicKeyBundle
    ? b.contact instanceof PublicKeyBundle
      ? a.contact.equals(b.contact)
      : false
    : b.contact instanceof SignedPublicKeyBundle
    ? a.contact.equals(b.contact)
    : false
}

function truncateHex(hex: string, shouldTruncate = true): string {
  if (!shouldTruncate) {
    return hex
  }
  if (hex.length < 8) {
    return hex
  }
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`
}
