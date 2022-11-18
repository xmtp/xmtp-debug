import { Client } from '@xmtp/xmtp-js'
// @ts-ignore
import { buildUserPrivateStoreTopic, nsToDate } from '@xmtp/xmtp-js/dist/cjs/src/utils'
import Long from 'long'

export default async function privateKeys(client: Client, address: string) {
    const timestamps = await client.listEnvelopes(
      [buildUserPrivateStoreTopic(`${address}/key_bundle`)],
      async (env) => {return { date: nsToDate(Long.fromString(env.timestampNs as string)) }}
    )
  
    console.table(timestamps)
  }