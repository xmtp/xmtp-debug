import { Client, SignedPublicKeyBundle, PublicKeyBundle } from '@xmtp/xmtp-js'
import { buildUserContactTopic, nsToDate } from '@xmtp/xmtp-js'
import { decodeContactBundle } from '@xmtp/xmtp-js'
import Long from 'long'
import { fetcher } from '@xmtp/proto'
import { toListOptions, bytesToHex } from './utils.js'
const { b64Decode } = fetcher
import {
  truncateHex,
  verifyIdentityKeyV1,
  verifyIdentityKeySignatureV1,
  verifyPreKeyV1,
  verifyIdentityKeyV2,
  verifyIdentityKeySignatureV2,
  verifyPreKeyV2,
} from './verify_utils.js'

type Contact = {
  timestamp: Date
  contact: PublicKeyBundle | SignedPublicKeyBundle
}

export async function getContactsWithClient(
  client: Client,
  address: string,
  argv: any
) {
  const contacts = await client.listEnvelopes(
    buildUserContactTopic(address),
    async (env: any) => {
      if (!env.message) {
        throw new Error('No message')
      }
      return {
        timestamp: nsToDate(Long.fromString(env.timestampNs as string)),
        contact: decodeContactBundle(env.message),
      }
    },
    toListOptions(argv)
  )
  return contacts
}

export default async function contacts(argv: any) {
  const { client, cmd, address, full } = argv
  const contacts = await client.listEnvelopes(
    buildUserContactTopic(address),
    async (env: any) => {
      if (!env.message) {
        throw new Error('No message')
      }
      return {
        timestamp: nsToDate(Long.fromString(env.timestampNs as string)),
        contact: decodeContactBundle(env.message),
      }
    },
    toListOptions(argv)
  )
  switch (cmd) {
    case 'list':
      await list(contacts, !full)
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

// Check for dev/prod confusion i.e. where a client mistakenly uploads
// prod contacts to dev or vice versa
export function crosscheckContacts(
  devContacts: Contact[],
  prodContacts: Contact[]
) {
  // Look for any identity keys that are the same in both environments. The identity key should
  // be unique per environment (generated randomly and independently)
  const devIdentityKeys = new Set<string>()
  const prodIdentityKeys = new Set<string>()
  for (const contact of devContacts) {
    devIdentityKeys.add(
      bytesToHex(contact.contact.identityKey.secp256k1Uncompressed.bytes)
    )
  }
  for (const contact of prodContacts) {
    prodIdentityKeys.add(
      bytesToHex(contact.contact.identityKey.secp256k1Uncompressed.bytes)
    )
  }
  const intersection = new Set(
    [...devIdentityKeys].filter((x) => prodIdentityKeys.has(x))
  )
  if (intersection.size > 0) {
    // Return an error message
    return `Found ${intersection.size} identity keys that are the same in both environments. The identity key should be unique per environment.`
  }
  return null
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
 * - If v2:
 *   - Identity key is a SignedPublicKey, embedding a serialized UnsignedPublicKey which satisfies the above
 *   - Ditto for prekey
 *   - Expect a .walletEcdsaCompact signature on the identity key (type SignedPublicKey)
 *   - The .walletEcdsaCompact is a valid secp256k1 signature that recovers to the correct address
 *   - Expect a .ecdsaCompact signature on the prekey (type SignedPublicKey)
 *   - The .ecdsaCompact is a valid secp256k1 signature that recovers to the identity key
 * @param contacts
 */
export async function verify(address: string, contacts: Contact[]) {
  // Rows is a list of [date, type, identityKey, preKey, concatenated invariant checks]
  let rows = []
  for (const { timestamp, contact } of contacts) {
    let errors = []
    // Verify v1
    if (contact instanceof PublicKeyBundle) {
      const { identityKey, preKey } = contact
      let idKeyErrors = verifyIdentityKeyV1(contact)
      errors.push(...idKeyErrors)
      let idkeySigErrors = verifyIdentityKeySignatureV1(address, contact)
      errors.push(...idkeySigErrors)
      let preKeyErrors = await verifyPreKeyV1(contact)
      errors.push(...preKeyErrors)

      let joinedErrors = errors.join(',')
      rows.push({
        date: timestamp,
        type: 'v1',
        errors: joinedErrors.length > 0 ? joinedErrors : 'ok',
      })
    } else if (contact instanceof SignedPublicKeyBundle) {
      // Verify v2
      let idKeyErrors = verifyIdentityKeyV2(contact)
      errors.push(...idKeyErrors)
      let idkeySigErrors = await verifyIdentityKeySignatureV2(address, contact)
      errors.push(...idkeySigErrors)
      let preKeyErrors = await verifyPreKeyV2(contact)
      errors.push(...preKeyErrors)

      let joinedErrors = errors.join(',')
      rows.push({
        date: timestamp,
        type: 'v2',
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
