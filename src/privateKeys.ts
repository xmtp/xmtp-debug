import { buildUserPrivateStoreTopic, nsToDate } from '@xmtp/xmtp-js'
import Long from 'long'
import { toListOptions } from './utils.js'

export default async function privateKeys(argv: any) {
  const { client, address } = argv
  const timestamps = await client.listEnvelopes(
    buildUserPrivateStoreTopic(`${address}/key_bundle`),
    async (env: any) => {
      return { date: nsToDate(Long.fromString(env.timestampNs as string)) }
    },
    toListOptions(argv)
  )

  console.table(timestamps)
}
