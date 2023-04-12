import { Client } from '@xmtp/xmtp-js'
import { randomWallet, resolveAddress } from './utils'

export default async function fillInvites(argv: any) {
  const { env, address: rawAddress, numInvites, numMessagesPerConvo } = argv
  const address = await resolveAddress(rawAddress)
  console.log(
    `Sending ${numInvites} invites to ${address} and sending ${numMessagesPerConvo} messages per invite`
  )

  await Promise.all(
    Array.from({ length: numInvites }, async (_, i) => {
      const client = await Client.create(randomWallet(), { env })
      const convo = await client.conversations.newConversation(address, {
        conversationId: `xmtp.org/test/${i}`,
        metadata: {},
      })
      for (let j = 0; j < numMessagesPerConvo; j++) {
        await convo.send(`gm ${j}`)
      }
    })
  )
}
