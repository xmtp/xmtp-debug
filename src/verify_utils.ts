import { SignedPublicKeyBundle, PublicKeyBundle } from '@xmtp/xmtp-js'
// @ts-ignore
import { sha256 } from '@xmtp/xmtp-js/dist/cjs/src/crypto/encryption'
// @ts-ignore
import { bytesToHex } from '@xmtp/xmtp-js/dist/cjs/src/crypto/utils'

export function truncateHex(hex: string, shouldTruncate = true): string {
  if (!shouldTruncate) {
    return hex
  }
  if (hex.length < 8) {
    return hex
  }
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`
}

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
    // Direct quote from BIP-137 (Just quoted for their description of a known key format)
    // The older uncompressed keys are 65 bytes, consisting of constant prefix (0x04), followed by two 256-bit integers called x and y (2 * 32 bytes).
    if (identityKey.secp256k1Uncompressed) {
      const idkey = identityKey.secp256k1Uncompressed.bytes
      if (idkey.length !== 65) {
        errors.push('idkey_bad')
      }
    }
  }
  return errors
}

export function verifyIdentityKeySignatureV1(
  address: string,
  keybundle: PublicKeyBundle
) {
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
    errors.push('idkey_wrong_sig_type_wallet')
    return errors
  }
  const idkeySig = identityKey.signature.ecdsaCompact.bytes
  // Signatures in proto form are (r, s) where r and s are 32 bytes each
  // The v can be appended to form a 65 byte signature, but in our case we
  // carry the recovery id separately
  if (idkeySig.length !== 64) {
    errors.push('idkey_sig_bad_len_' + idkeySig.length)
    return errors
  }
  // Check that the signature recovers to the correct address
  const recoveredAddress = identityKey.walletSignatureAddress()
  if (recoveredAddress !== address) {
    errors.push('idkey_sig_bad_recovers_to_' + truncateHex(recoveredAddress))
  }
  return errors
}

export async function verifyPreKeyV1(keybundle: PublicKeyBundle) {
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
  let identityKey = keybundle.identityKey
  if (!identityKey || !identityKey.secp256k1Uncompressed) {
    // missing identity key should be caught by verifyIdentityKeyV1
    return errors
  }
  // Check that the prekey signature is valid and signed by the identity key
  // Need to get the payload from prekey bytesToSign
  if (!preKey.signature) {
    errors.push('prekey_sig_missing')
    if (!preKey.signature!.ecdsaCompact) {
      errors.push('prekey_wrong_sig_type_wallet')
      return errors
    }
  }
  // Check that the prekey is signed by the identity key
  let digest = await sha256(preKey.bytesToSign())
  let recoveredKey = preKey.signature!.getPublicKey(digest)
  const identityKeyHex = bytesToHex(identityKey.secp256k1Uncompressed.bytes)
  if (!recoveredKey) {
    errors.push('prekey_sig_bad_recovers_to_null')
    return errors
  }
  const recoveredKeyHex = bytesToHex(recoveredKey!.secp256k1Uncompressed.bytes)
  if (identityKeyHex !== recoveredKeyHex) {
    errors.push('prekey_not_signed_by_idkey')
  }
  return errors
}
