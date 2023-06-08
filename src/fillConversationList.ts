import { Client } from '@xmtp/xmtp-js'
import { randomWallet, resolveAddress, appVersion } from './utils'

// See rule "publish" in https://github.com/xmtp-labs/infrastructure/blob/main/plans/production/public_load_balancer.tf
const wafLimit = 1000 // publish calls per IP
const wafLimitPeriodMs = 300000 // 5 min
const nonMessageCallsPerConvo = 5 // 2 * invite + 2 * contact + 1 * private key bundle

export default async function fillInvites(argv: any) {
  const { env, address: rawAddress, numInvites, numMessagesPerConvo } = argv
  const address = await resolveAddress(rawAddress)
  console.log(
    `Sending ${numInvites} invites to ${address} and sending ${numMessagesPerConvo} messages per invite`
  )
  const batchSize = wafLimit / (numMessagesPerConvo + nonMessageCallsPerConvo)
  let remaining = numInvites
  while (remaining > 0) {
    const batch = remaining < batchSize ? remaining : batchSize
    remaining -= batch
    const start = Date.now()
    await Promise.all(
      Array.from({ length: batch }, async (_, i) => {
        const client = await Client.create(randomWallet(), { env, appVersion })
        const convo = await client.conversations.newConversation(address, {
          conversationId: `xmtp.org/test/${remaining+i}`,
          metadata: {},
        })
        for (let j = 0; j < numMessagesPerConvo; j++) {
          await convo.send(`gm ${j}`)
        }
      })
    )
    console.log(`Created ${batch} conversations`)
    if (remaining > 0) {
      // wait until the WAF limit 1000 publishes / 5 min expires
      const delay = start - Date.now() + wafLimitPeriodMs
      console.log(`Waiting ${delay} ms for the next WAF limit window`)
      await new Promise((resolve) => setTimeout(() => resolve(null), delay))
    }
  }
}
