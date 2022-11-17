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
    console.log('date sender => recipient')
    for(const invite of invites) {
        const header = invite.v1.header
        console.log(
            nsToDate(header.createdNs),
            truncateEthAddress(await header.sender.walletSignatureAddress()),
            '=>',
            truncateEthAddress(await header.recipient.walletSignatureAddress()),
        )
    }
}
