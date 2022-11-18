import { Client } from '@xmtp/xmtp-js'
// @ts-ignore
import { SealedInvitation } from '@xmtp/xmtp-js/dist/cjs/src/Invitation'
// @ts-ignore
import { buildUserInviteTopic, nsToDate } from '@xmtp/xmtp-js/dist/cjs/src/utils'
import { truncateEthAddress } from './utils'


export default async function invites(client: Client, cmd: string, address: string) {
    const invites = await client.listEnvelopes(
        [buildUserInviteTopic(address)],
        SealedInvitation.fromEnvelope,
    )
    switch(cmd){
    case 'list': await list(invites); break
    default: console.log(`invalid command ${cmd}`)
    }
}

async function list(invites: SealedInvitation[]) {
    let rows = []
    for(const invite of invites) {
        const header = invite.v1.header
        rows.push({
        date: nsToDate(header.createdNs),
        sender: truncateEthAddress(await header.sender.walletSignatureAddress()),
        recipient: truncateEthAddress(await header.recipient.walletSignatureAddress()),
    })
    }
    console.table(rows)
}
