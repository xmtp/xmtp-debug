import { Client, SortDirection, PublicKey, PublicKeyBundle, SignedPublicKeyBundle } from '@xmtp/xmtp-js'
// @ts-ignore
import { buildUserIntroTopic, nsToDate } from '@xmtp/xmtp-js/dist/cjs/src/utils'
// @ts-ignore
import { MessageV1 } from '@xmtp/xmtp-js/dist/cjs/src/Message'
import Long from 'long'
import { fetcher } from '@xmtp/proto'
const { b64Decode } = fetcher

export default async function intros(client: Client, cmd: string, address: string) {
  let currentContact = await client.getUserContact(address)
  if (!currentContact) {
    throw new Error('No contact for address ${address}')
  }
  if(currentContact instanceof SignedPublicKeyBundle) {
    currentContact = currentContact.toLegacyBundle()
  }
    const intros = await client.listEnvelopes(
      [buildUserIntroTopic(address)],
      async (env) => {
        if (!env.message) {
          throw new Error('No message')
        }
        return {
          timestamp: nsToDate(Long.fromString(env.timestampNs as string)),
          message: await MessageV1.fromBytes(
            b64Decode(env.message as unknown as string)
          ),
        }
      },
      { direction: SortDirection.SORT_DIRECTION_ASCENDING }
    )
    switch(cmd){
    case 'check': await check(intros, currentContact); break
    case 'list': await list(intros, currentContact); break
    default: console.log(`invalid command ${cmd}`)
    }
}

async function list(intros: { timestamp: Date, message: MessageV1 }[], currentContact: PublicKeyBundle) { 
}

async function check(intros: { timestamp: Date, message: MessageV1 }[], currentContact: PublicKeyBundle) { 
    let totalIntros = 0
    let unmatchedContacts = 0
    for (const { message, timestamp } of intros) {
      totalIntros++
      if (!message.header.sender?.preKey || !message.header.recipient?.preKey) {
        console.log('Broken headers')
        continue
      }
      if (
        !currentContact.preKey?.equals(
          new PublicKey(message.header.sender.preKey)
        ) &&
        !currentContact.preKey?.equals(
          new PublicKey(message.header.recipient.preKey)
        )
      ) {
        console.log('Bundles not equal', timestamp)
        unmatchedContacts++
      }
    }
    console.log(`Total intros: ${totalIntros}. Unmatched: ${unmatchedContacts}`)
  }