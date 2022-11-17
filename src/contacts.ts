import { Client, SignedPublicKeyBundle, SortDirection, PublicKeyBundle } from '@xmtp/xmtp-js'
import { buildUserContactTopic, nsToDate } from '@xmtp/xmtp-js/dist/cjs/src/utils'
import { decodeContactBundle } from '@xmtp/xmtp-js/dist/types/src/ContactBundle'
import { bytesToHex } from '@xmtp/xmtp-js/dist/types/src/crypto/utils'
import Long from 'long'
import { fetcher } from '@xmtp/proto'
const { b64Decode } = fetcher

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
    for (const { timestamp, contact } of contacts) {
      const type =
        contact instanceof PublicKeyBundle
          ? 'V1'
          : contact instanceof SignedPublicKeyBundle
          ? 'V2'
          : typeof contact
      console.log(
        timestamp,
        type,
        bytesToHex(contact.identityKey.secp256k1Uncompressed.bytes)
          .slice(0, 10)
        // utils.bytesToHex(contact.preKey.secp256k1Uncompressed.bytes)
      )
    }
  }
  