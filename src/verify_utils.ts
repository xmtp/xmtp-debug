import { SignedPublicKeyBundle, PublicKeyBundle } from '@xmtp/xmtp-js'

export function verifyIdentityKeyV1(keybundle: PublicKeyBundle) {
  let errors: string[] = []
  let identityKey = keybundle.identityKey
  if (!identityKey) {
    errors.push('idkey_missing')
    return errors
  }
  if (!identityKey.secp256k1Uncompressed) {
    errors.push('idkey_missing')
    return errors
  } else {
    if (identityKey.secp256k1Uncompressed) {
      const idkey = identityKey.secp256k1Uncompressed.bytes
      if (idkey.length !== 65) {
        errors.push('idkey_bad')
      }
    }
  }
  return errors
}

export function verifyIdentityKeySignatureV1(keybundle: PublicKeyBundle) {
  let errors: string[] = []
  let identityKey = keybundle.identityKey
  if (!identityKey) {
    return errors
  }
  if (!identityKey.signature) {
    errors.push('idkey_sig_missing')
    return errors
  }
  if (!identityKey.signature.ecdsaCompact) {
    errors.push('idkey_wrong_sig_type')
    return errors
  }
  const idkeySig = identityKey.signature.ecdsaCompact.bytes
  if (idkeySig.length !== 64) {
    errors.push('idkey_sig_bad_len_' + idkeySig.length)
  }
  return errors
}

export function verifyPreKeyV1(keybundle: PublicKeyBundle) {
  let errors: string[] = []
  let preKey = keybundle.preKey
  if (!preKey) {
    return errors
  }
  if (!preKey.secp256k1Uncompressed) {
    errors.push('prekey_missing')
    return errors
  } else {
    if (preKey.secp256k1Uncompressed) {
      const prekey = preKey.secp256k1Uncompressed.bytes
      if (prekey.length !== 65) {
        errors.push('prekey_bad')
      }
    }
  }
  return errors
}
