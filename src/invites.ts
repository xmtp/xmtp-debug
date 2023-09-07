import { SealedInvitation, buildUserInviteTopic, nsToDate } from '@xmtp/xmtp-js'
import { toListOptions, truncateEthAddress } from './utils.js'

export default async function invites(argv: any) {
  const { client, cmd, address, full } = argv
  const invites = await client.listEnvelopes(
    buildUserInviteTopic(address),
    SealedInvitation.fromEnvelope,
    toListOptions(argv)
  )
  switch (cmd) {
    case 'list':
      await list(invites, !full)
      break
    default:
      console.log(`invalid command ${cmd}`)
  }
}

async function list(invites: SealedInvitation[], truncate = true) {
  let rows = []
  for (const invite of invites) {
    const header = invite?.v1?.header
    if (!header) {
      console.warn('No header')
      continue
    }
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
