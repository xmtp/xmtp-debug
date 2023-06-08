// @ts-ignore
import { SealedInvitation } from '@xmtp/xmtp-js'
import {
  buildUserInviteTopic,
  nsToDate,
  // @ts-ignore
} from '@xmtp/xmtp-js'
import { toListOptions, toPaginatedListOptions, truncateEthAddress } from './utils'

export default async function invites(argv: any) {
  const { client, cmd, address, full, page, batchSize, batchCount } = argv
  const loadEnvelopes = page ?
    async () => {
      let invites: SealedInvitation[] = []
      for await (const page of client.listEnvelopesPaginated(
        buildUserInviteTopic(address),
        SealedInvitation.fromEnvelope,
        toPaginatedListOptions(argv))) {
          invites = invites.concat(page)
        }
        return invites
    } :
    () => client.listEnvelopes(
    buildUserInviteTopic(address),
    SealedInvitation.fromEnvelope,
    toListOptions(argv)
  )
  switch (cmd) {
    case 'list':
      await list(loadEnvelopes, !full)
      break
    case 'load':
      await load(loadEnvelopes, batchSize, batchCount)
      break
    default:
      console.log(`invalid command ${cmd}`)
  }
}

async function list(loadEnvelopes: () => Promise<SealedInvitation[]>, truncate = true) {
  const invites = await loadEnvelopes()
  let rows = []
  for (const invite of invites) {
    if (!invite.v1) continue
    const header = invite.v1.header
    rows.push({
      date: nsToDate(header.createdNs),
      sender: truncateEthAddress(
        await header.sender.walletSignatureAddress(),
        truncate
      ),
      recipient: truncateEthAddress(
        await header.recipient.walletSignatureAddress(),
        truncate
      ),
    })
  }
  console.table(rows)
}

async function load(loadEnvelopes: () => Promise<SealedInvitation[]>, batchSize: number, batchCount: number) {
  console.log(`running ${batchCount} load tests with ${batchSize} parallel loads each`)
  for (let i = 0; i < batchCount; i++) {
    console.log(`${new Date().toISOString()} started batch ${i}`);
    const results = await Promise.allSettled(
      Array.from({ length: batchSize }, async (_, i) => loadEnvelopes()))
    const totals = results.reduce(addResult, new Map())
    for (const [k,v] of totals) {
      console.log(`${k} = ${v}`)
    }
  }
}

function incKey(results: Map<string, number>, key: string): Map<string, number> {
  results.set(key, 1 + (results.get(key) || 0))
  return results
}

function addResult(results: Map<string, number>, result: PromiseSettledResult<any>): Map<string, number> {
  return result.status == "fulfilled" ?
    incKey(results, `results ${result.value.length}`) :
    incKey(results, result.reason.toString())
}