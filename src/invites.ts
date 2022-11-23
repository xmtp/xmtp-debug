import { Client } from '@xmtp/xmtp-js'
// @ts-ignore
import { SealedInvitation } from '@xmtp/xmtp-js/dist/cjs/src/Invitation'
// @ts-ignore
import { buildUserInviteTopic, nsToDate } from '@xmtp/xmtp-js/dist/cjs/src/utils'
import { truncateEthAddress } from './utils'


export default async function invites(argv: any) {
    const {client, cmd, address, long} = argv
    const invites = await client.listEnvelopes(
        [buildUserInviteTopic(address)],
        SealedInvitation.fromEnvelope,
    )
    switch(cmd){
    case 'list': await list(invites, !long); break
    default: console.log(`invalid command ${cmd}`)
    }
}

async function list(invites: SealedInvitation[], truncate = true) {
    let rows = []
    for(const invite of invites) {
        const header = invite.v1.header
        rows.push({
        date: nsToDate(header.createdNs),
        sender: truncateEthAddress(await header.sender.walletSignatureAddress(), truncate),
        recipient: truncateEthAddress(await header.recipient.walletSignatureAddress(), truncate),
    })
    }
    console.table(rows)
}
