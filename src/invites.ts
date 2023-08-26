// @ts-ignore
import { SealedInvitation } from '@xmtp/xmtp-js/dist/cjs/src/Invitation'
import {
  buildUserInviteTopic,
  nsToDate,
  // @ts-ignore
} from '@xmtp/xmtp-js/dist/cjs/src/utils'
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
