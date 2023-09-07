import { Client } from '@xmtp/xmtp-js'
import { randomWallet, chunkArray, sleep } from './utils.js'
import { BaseResolvedArgs } from './types.js'

type FillInvitesArgs = BaseResolvedArgs & {
  numInvites: number
  numMessagesPerConvo: number
}

const CHUNK_SIZE = 100

export default async function fillInvites(argv: FillInvitesArgs) {
  const { env, address, numInvites, numMessagesPerConvo } = argv
  console.log(
    `Creating ${numInvites} conversations with ${address} and sending ${numMessagesPerConvo} messages per conversation`
  )

  const allRequests = [...new Array(numInvites).keys()]
  const chunked = chunkArray(allRequests, CHUNK_SIZE)

  // Create one client for each item in the chunk so that there is no contention on mutexes
  const clients = await Promise.all([...new Array(CHUNK_SIZE).keys()].map(() => Client.create(randomWallet(), {
    env,
    skipContactPublishing: true,
    appVersion: 'xmtp-debug/0.0.0',
  })))

  const runPrefix = `run-${Math.floor(Math.random() * 100000)}`
  let totalSent = 0
  for (const chunk of chunked) {
    await Promise.all(
      chunk.map(async (i, chunkIndex) => {
        const client = clients[chunkIndex]
        const convo = await client.conversations.newConversation(address, {
          conversationId: `${runPrefix}-${i}`,
          metadata: {}
        })

        for (let j = 0; j < numMessagesPerConvo; j++) {
          await convo.send(`gm ${j}`)
        }
      })
    )
    totalSent += chunk.length
    console.log(`Created ${totalSent} conversations`)
    await sleep(1000)
  }
}
