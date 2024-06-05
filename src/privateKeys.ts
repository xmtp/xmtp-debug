import { buildUserPrivateStoreTopic, nsToDate } from '@xmtp/xmtp-js'
import Long from 'long'
import { sha256, toListOptions } from './utils.js'

export default async function privateKeys(argv: any) {
  const { client, address } = argv
  const timestamps = await client.listEnvelopes(
    buildUserPrivateStoreTopic(`${address}/key_bundle`),
    async (env: any) => {
      return {
        date: nsToDate(Long.fromString(env.timestampNs as string)),
        hash: Buffer.from(await sha256(env.message)).toString('hex'),
      }
    },
    toListOptions(argv)
  )

  console.table(timestamps)
}
