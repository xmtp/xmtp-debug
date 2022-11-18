import { Client, SignedPublicKeyBundle, SortDirection, PublicKeyBundle } from '@xmtp/xmtp-js'
// @ts-ignore
import { buildUserContactTopic, nsToDate } from '@xmtp/xmtp-js/dist/cjs/src/utils'
// @ts-ignore
import { decodeContactBundle } from '@xmtp/xmtp-js/dist/cjs/src/ContactBundle'
// @ts-ignore
import { bytesToHex } from '@xmtp/xmtp-js/dist/cjs/src/crypto/utils'
import Long from 'long'
import { fetcher } from '@xmtp/proto'
const { b64Decode } = fetcher

type Contact = {
  timestamp: Date,
  contact: PublicKeyBundle | SignedPublicKeyBundle
}

export default async function contacts(client: Client, cmd: string, address: string) {
    const contacts = await client.listEnvelopes(
      [buildUserContactTopic(address)],
      async (env) => {
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
      { direction: SortDirection.SORT_DIRECTION_ASCENDING }
    )
    switch(cmd){
      case 'list': await list(contacts); break;
      case 'check': await check(contacts); break;
      default: console.log(`invalid command ${cmd}`)
      }
    }

  async function list(contacts: Contact[]) {
    let rows = []
    for (const { timestamp, contact } of contacts) {
      const type =
        contact instanceof PublicKeyBundle
          ? 'V1'
          : contact instanceof SignedPublicKeyBundle
          ? 'V2'
          : typeof contact
      const identityKey = bytesToHex(contact.identityKey.secp256k1Uncompressed.bytes)
      const preKey = bytesToHex(contact.preKey.secp256k1Uncompressed.bytes)
      rows.push({
        date: timestamp,
        type: type,
        identityKey: truncateHex(identityKey),
        preKey: truncateHex(preKey)
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
      console.log(
        'Contact changed',
        contact.timestamp
      )
      numMismatched++
    }
    lastContact = contact
  }
  console.log(
    `Number of contacts: ${numContacts}. Mismatched: ${numMismatched}`
  )
}

function equal(a: Contact, b: Contact): boolean {
  return a.contact instanceof PublicKeyBundle
  ? b.contact instanceof PublicKeyBundle ?
      a.contact.equals(b.contact):false
  : b.contact instanceof SignedPublicKeyBundle ?
      a.contact.equals(b.contact): false
}

function truncateHex(hex: string): string {
  if(hex.length < 8) { return hex }
  return `${hex.slice(0,4)}…${hex.slice(-4)}`
}