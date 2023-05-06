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
  // Basic cryptographic foundation tests
  // - Can perform sha256 digest
  sha256Digest: {
    preconditions: {},
    description: 'Verify that a sha256 digest of a string is correct.',
    input: {
      messageHex: '"616263"', // abc as hex
    },
    outputConditions: {
      digest: {
        outputHex:
          '"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"',
      },
    },
  },
  // - Can perform keccak256 digest
  keccak256Digest: {
    preconditions: {},
    description: 'Verify that a keccak256 digest of a string is correct.',
    input: {
      messageHex: '"616263"', // abc as hex
    },
    outputConditions: {
      digest: {
        outputHex:
          '"4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"',
      },
    },
  },
  // - Can generate secp256k1 public key from private key
  secp256k1PublicKeyFromPrivateKey: {
    preconditions: {},
    description:
      'Verify that a secp256k1 public key can be generated from a private key.',
    input: {
      privateKeyHex:
        '"8462d54e1887d1b8fe7567d06c5460c01c42ca2b973a3b93d4b047c8defd4fda"',
    },
    outputConditions: {
      publicKey: {
        outputHex:
          '04d935d2cd9d0f8d0168de0297fef5060b102b4223c78abc6f14bcb1941f05ae08a9ad1bfc1c072ed71689f05ddd994be5ff41c1897a1ac9718115e94a468ab7dc',
      },
    },
  },
  // - Can verify a secp256k1 ECDSA signature with keccak256 as digest mechanism
  secp256k1VerifySignatureKeccak256: {
    preconditions: {},
    description:
      'Verify that a secp256k1 ECDSA signature can be verified with keccak256 as the digest mechanism.',
    input: {
      publicKeyHex: '"...."',
      messageHex: '"...."',
      signatureHex: '"...."',
    },
    outputConditions: {
      result: {
        isValid: 'true',
      },
    },
  },
  // - Can catch a forged secp256k1 ECDSA signature with keccak256 as digest mechanism
  secp256k1CatchForgedSignatureKeccak256: {
    preconditions: {},
    description:
      'Verify that a forged secp256k1 ECDSA signature can be caught with keccak256 as the digest mechanism.',
    input: {
      publicKeyHex: '"...."',
      messageHex: '"...."',
      signatureHex: '"...."',
    },
    outputConditions: {
      result: {
        isValid: 'false',
      },
    },
  },
  // - Can verify a secp256k1 ECDSA signature with sha256 as digest mechanism
  secp256k1VerifySignatureSha256: {
    preconditions: {},
    description:
      'Verify that a secp256k1 ECDSA signature can be verified with sha256 as the digest mechanism.',
    input: {
      publicKeyHex: '"...."',
      messageHex: '"...."',
      signatureHex: '"...."',
    },
    outputConditions: {
      result: {
        isValid: 'true',
      },
    },
  },
  // - Can catch an invalid secp256k1 ECDSA signature with sha256 as digest mechanism
  secp256k1CatchInvalidSignatureSha256: {
    preconditions: {},
    description:
      'Verify that an invalid secp256k1 ECDSA signature can be caught with sha256 as the digest mechanism.',
    input: {
      publicKeyHex: '"...."',
      messageHex: '"...."',
      signatureHex: '"...."',
    },
    outputConditions: {
      result: {
        isValid: 'false',
      },
    },
  },
  // - Has ability to form EIP191 ethereum message hash
  // Identity tests - upon new identity creation what are we expecting?
  identityCreation: {
    // Wallet private key in hex
    preconditions: {},
    description:
      'Verify that a newly created XMTP identity as a PrivateKeyBundleV1 object is valid. This means that the identity key is signed by the wallet private key, and the prekey is signed by the identity key. All keys are on the curve secp256k1. Private keys are 32 bytes, public keys are 64 bytes, and signatures are 64 bytes, with an integer recoveryId.',
    input: {
      walletPrivateKeyHex: '"977533310754dff7a630bc2ccf283317791d2d30cb030fb6cf6864beba749337"',
    },
    outputConditions: {
      privateKeyBundleV1: {
        address: '"0x83150c471F3c8215e1c372a2378D9Ffa95485AF5"',
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
      walletPrivateKeyHex: '"977533310754dff7a630bc2ccf283317791d2d30cb030fb6cf6864beba749337"',
    },
    outputConditions: {
      contactBundleV1: {
        address: '"0x83150c471F3c8215e1c372a2378D9Ffa95485AF5"',
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
  contactBundleUsageValidation: {
    preconditions: {},
    description:
      'Similar to checks for verifying a newly created ContactBundle, but on the accepting or receiving side. Utilizes two hardcoded serialized ContactBundles protobufs, one with .v1 and one with .v2',
    input: {
      validVersionedContactBundleV1Hex: '"0aad020aaa020a920108fc828fa2fe3012440a420a407f90cbb57354a1a32885e2829c77b4be806c67158baa5f975492cd65aac8c0197d7137bb65a6ee6aa3a2bc789f39905cc54ebb7fdd7aaba4a355fb6ff52c15d31a430a4104c042179e99c799cf398f20d3f896d24a9a60485a5e988d169f2284a03455c438d66a8ac65f452262a7f346dfe2c8fc6c608c62011ed02cefe2d257a374562d5912920108a1838fa2fe3012440a420a401f62a07c9ee90aae68d6f9746b422cd671a76f2dc2c12b882b8c4ee4c0eb9e3a1e6838b184b43fdbe1530de044f6728fa2bbc696e1be730f292648c186e843f61a430a410455765be2fe7c12913e4a04dfe27c73da0746896ffb4fecf25869420cda976fe936b7223685ffc8ed0abed4cd1de003c6cc30734a5276a7568aae5c5e417df055"',
      validVersionedContactBundleV2Hex: '"12bb020ab8020a99010a4f08c08accdd8aa7f2ad171a430a410433fca669cf6ab40c52216fd9da110536c66f734b653510351a0e8089d4d6a01d8523a0da1961058f1f7b0040dddf6872ed12f242ff7f372f8d2fbbe0de1e9c83124612440a40c3b2d9130625445d154a7e7f97c6fe177865ea57ca0ecd18fad8dc3c8cf16d5638b46d22a68afbd73c7187a5703dca2d6e37a3d482ce1d16c6abece28c243ba310011299010a4f08c0ace1ee8aa7f2ad171a430a41044747cd15e070a2a737957e67c5bf618cdccaadc509829b21097d7b2129fdf1c84324ea54157929d683c4bf77d117d5600ad0d736c42858bfa7ee7667c9bc719a12460a440a407cdfde991712d85f134b368b5e9ef9a70edc30c843f40202160879a6198cabf1563b96166e47dbd2c79d10aa1b646b402f5c73251b92c218fcc8533124f256fb1001"',
    },
    outputConditions: {
      contactBundleV1: {
        address: '"0xb93E78f23E34184437bB1f82564b716294a939b0"',
        throwComment_identityKeyExistsAndIsSignedByWallet:
          'Check that the identity key exists and is signed by the wallet private key',
        throwComment_ecdsaCompactSignatureIsValid:
          'Check that the .ecdsaCompact signature is valid',
        throwComment_preKeyExistsAndIsSignedByIdentity:
          'Check that the prekey exists and is signed by the identity key, after sha256()',
      },
      contactBundleV2: {
        address: '"0x609bdC6803B921dB36d8579FdD3204fa98F3D3Da"',
        throwComment_identityKeyExistsAndIsSignedByWallet:
          'Check that the identity key exists and is signed by the wallet private key',
        throwComment_preKeyExistsAndIsSignedByIdentity:
          'Check that the prekey exists and is signed by the identity key, after sha256()',
        throwComment_walletEcdsaCompactSignatureIsValid:
          'Check that the .walletEcdsaCompact signature is valid',
      },
    },
  },
  invalidContactBundleRejection: {
    preconditions: {},
    description: 'Confirms that invalid contact bundles (with various issues) are rejected correctly.",
    input: {
  inviteCreationValidation: {},
  inviteOpeningValidation: {},
  messageEncryptionValidation: {},
  improperMessageEncryptionRejection: {},
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
