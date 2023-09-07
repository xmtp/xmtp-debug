import { ApiUrls, Client } from '@xmtp/xmtp-js'

export interface BaseResolvedArgs {
  client: Client
  address: string
  env: keyof typeof ApiUrls
}
