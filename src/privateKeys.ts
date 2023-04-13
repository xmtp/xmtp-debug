import {
  buildUserPrivateStoreTopic,
  nsToDate,
  // @ts-ignore
} from '@xmtp/xmtp-js/dist/cjs/src/utils'
import Long from 'long'
import { toListOptions } from './utils'

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
