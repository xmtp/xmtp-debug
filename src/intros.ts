import {
  PublicKey,
  PublicKeyBundle,
  SignedPublicKeyBundle,
  Client,
} from '@xmtp/xmtp-js'
import { buildUserIntroTopic, nsToDate } from '@xmtp/xmtp-js'
import { MessageV1 } from '@xmtp/xmtp-js'
import Long from 'long'
import { fetcher } from '@xmtp/proto'
import { toListOptions, truncateEthAddress } from './utils.js'

export default async function intros(argv: {
  client: Client
  cmd: string
  address: string
  full: boolean
}) {
  const { client, cmd, address, full } = argv
  let currentContact = await client.getUserContact(address)
  if (!currentContact) {
    throw new Error('No contact for address ${address}')
  }
  if (currentContact instanceof SignedPublicKeyBundle) {
    currentContact = currentContact.toLegacyBundle()
  }
  const intros = await client.listEnvelopes(
    buildUserIntroTopic(address),
    async (env: any) => {
      if (!env.message) {
        throw new Error('No message')
      }
      return {
        timestamp: nsToDate(Long.fromString(env.timestampNs as string)),
        message: await MessageV1.fromBytes(env.message),
      }
    },
    toListOptions(argv)
  )
  switch (cmd) {
    case 'check':
      await check(intros, currentContact)
      break
    case 'list':
      await list(intros, !full)
      break
    default:
      console.log(`invalid command ${cmd}`)
  }
}

async function list(
  intros: { timestamp: Date; message: MessageV1 }[],
  shouldTruncate = true
) {
  let rows = []
  for (const intro of intros) {
    const message = intro.message
    rows.push({
      date: intro.timestamp,
      sender: message.senderAddress
        ? truncateEthAddress(message.senderAddress, shouldTruncate)
        : 'undefined',
      recipient: message.recipientAddress
        ? truncateEthAddress(message.recipientAddress, shouldTruncate)
        : 'undefined',
    })
  }
  console.table(rows)
}

async function check(
  intros: { timestamp: Date; message: MessageV1 }[],
  currentContact: PublicKeyBundle
) {
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
