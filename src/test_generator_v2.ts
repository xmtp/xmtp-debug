// Class that generates test data in various languages
// At the base level, a test case is:
// - preconditions (optional)
// - input
// - expected behavior (various forms, either hardcoded vectors or a placeholder "throw" with a comment)

import { TypeScriptGenerator } from './test_generators/typescript_generator'
import { RustGenerator } from './test_generators/rust_generator'

export type TestCase = {
  preconditions?: { [key: string]: string }
  description: string
  input: { [key: string]: string }
  outputConditions: { [key: string]: { [key: string]: string } }
}

const MESSAGE_TEST_CASES: { [key: string]: TestCase } = {
  // Identity tests - upon new identity creation what are we expecting?
  identityCreation: {
    // Wallet private key in hex
    preconditions: {},
    description:
      'Verify that a newly created XMTP identity as a PrivateKeyBundleV1 object is valid. This means that the identity key is signed by the wallet private key, and the prekey is signed by the identity key. All keys are on the curve secp256k1. Private keys are 32 bytes, public keys are 64 bytes, and signatures are 64 bytes, with an integer recoveryId.',
    input: {
      walletPrivateKey: '"0x00"',
    },
    outputConditions: {
      privateKeyBundleV1: {
        address: '"0x0000"',
        throwComment_identityKeyIsValidSecp256k1:
          'Check that the identity key is a valid secp256k1 private key',
        throwComment_checkIdentityKeySignedByWallet:
          'Check that the identity key is signed by the wallet private key',
        throwComment_checkPreKeyIsValidSecp256k1:
          'Check that the prekey is a valid secp256k1 private key',
        throwComment_checkPreKeySignedByIdentity:
          'Check that the prekey is signed by the identity key',
      },
    },
  },
  // A series tests that check contact bundles, not only on creation but upon consumption
  // of a hardcoded valid contact bundle and rejection of a hardcoded invalid contact bundle (multiple forgeries)
  // - If v1:
  //   - Identity key is a valid secp256k1 uncompressed public key
  //   - Pre key is a valid secp256k1 uncompressed public key
  //   - IdentityKey is a PublicKey with a signature, the signature has .ecdsaCompact
  //     - The .ecdsaCompact is a valid secp256k1 signature that recovers to the correct address
  //   - PreKey is a PublicKey with a signature, the signature has .ecdsaCompact
  //     - The .ecdsaCompact is a valid secp256k1 signature that recovers to the identity key
  // - If v2:
  //   - Identity key is a SignedPublicKey, embedding a serialized UnsignedPublicKey which satisfies the above
  //   - Ditto for prekey
  //   - Expect a .walletEcdsaCompact signature on the identity key (type SignedPublicKey)
  //   - The .walletEcdsaCompact is a valid secp256k1 signature that recovers to the correct address
  //   - Expect a .ecdsaCompact signature on the prekey (type SignedPublicKey)
  //   - The .ecdsaCompact is a valid secp256k1 signature that recovers to the identity key
  contactBundleCreation: {
    preconditions: {
      privateKeyBundleV1:
        'Use the identityCreation test case to generate a valid identity, and use the output privateKeyBundleV1',
    },
    description:
      'Verify that a newly created XMTP contact bundle as a ContactBundleV1 object is valid. This means that the contact key is signed by the identity key, and the prekey is signed by the contact key. All keys are on the curve secp256k1. Private keys are 32 bytes, public keys are 64 bytes, and signatures are 64 bytes, with an integer recoveryId.',
    input: {
      walletPrivateKey: '"0x00"',
    },
    outputConditions: {
      contactBundleV1: {
        address: '"0x0000"',
        throwComment_identityKeyIsValidSecp256k1:
          'Check that the identity key is a valid secp256k1 private key',
        throwComment_checkIdentityKeySignedByWallet:
          'Check that the identity key is signed by the wallet private key',
        throwComment_checkPreKeyIsValidSecp256k1:
          'Check that the prekey is a valid secp256k1 private key',
        throwComment_checkPreKeySignedByIdentity:
          'Check that the prekey is signed by the identity key',
        throwComment_checkKeysMatchPrivateKeyBundle:
          'Check that the identity key and prekey match the private key bundle',
      },
    },
  },
  contactBundleConsumptionValid: {
    preconditions: {},
    description:
      'Similar to checks for verifying a newly created ContactBundle, but on the accepting or receiving side. Utilizes two hardcoded serialized ContactBundles protobufs, one with .v1 and one with .v2',
    input: {
      validVersionedContactBundleV1: '"0x00"',
      validVersionedContactBundleV2: '"0x00"',
    },
    outputConditions: {
      contactBundleV1: {
        address: '"0x0000"',
        throwComment_identityKeyExistsAndIsSignedByWallet:
          'Check that the identity key exists and is signed by the wallet private key',
        throwComment_ecdsaCompactSignatureIsValid:
          'Check that the .ecdsaCompact signature is valid',
        throwComment_preKeyExistsAndIsSignedByIdentity:
          'Check that the prekey exists and is signed by the identity key, after sha256()',
      },
      contactBundleV2: {
        address: '"0x0000"',
        throwComment_identityKeyExistsAndIsSignedByWallet:
          'Check that the identity key exists and is signed by the wallet private key',
        throwComment_preKeyExistsAndIsSignedByIdentity:
          'Check that the prekey exists and is signed by the identity key, after sha256()',
        throwComment_walletEcdsaCompactSignatureIsValid:
          'Check that the .walletEcdsaCompact signature is valid',
      },
    },
  },
}

// Language generators
// - TypeScript
// - Rust
// - Swift
// - Kotlin
// - Dart (low priority)
//
// Generators follow the pattern:
// - Take in a test case
// - Generate a function that has the test case name
// - Generate a section for preconditions which are comments
// - Generate a section for inputs which are assignments
// - Generate a section for expected outputs
//   - This means for each output object, generate a section for it
//   - Either generate a failing assert or a comment for each key/value pair
type Generator = {
  generate: () => string
}

export const GENERATORS: { [key: string]: Generator } = {
  typescript: new TypeScriptGenerator(MESSAGE_TEST_CASES),
  rust: new RustGenerator(MESSAGE_TEST_CASES),
}

export function generate(language: string) {
  if (!GENERATORS[language]) {
    throw new Error(`Unsupported language: ${language}`)
  }
  const sourceString = GENERATORS[language].generate()
  // Print it out nicely
  console.log('== Generated for language: ' + language + ' ==')
  console.log(sourceString)
  console.log('== End generated for language: ' + language + ' ==')
}
