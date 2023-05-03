// Class that generates test data in various languages
// At the base level, a test case is:
// - preconditions (optional)
// - input
// - expected behavior (various forms, either hardcoded vectors or a placeholder "throw" with a comment)

import { TypeScriptGenerator } from './test_generators/typescript_generator'

type TestCase = {
  preconditions?: any
  input: any
  outputConditions: any
}

const MESSAGE_TEST_CASES = {
  // Identity tests - upon new identity creation what are we expecting?
  identityCreation: {
    // Wallet private key in hex
    preconditions: {
      walletPrivateKey: '"0x00"',
    },
    input: {},
    outputConditions: {
      privateKeyBundleV1: {
        address: '"0x0000"',
        throwComment_identityKeyIsValidSecp256k1:
          'Check that the identity key is a valid secp256k1 private key',
        throwComment_checkIdentityKeySignedByWallet:
          'Check that the identity key is signed by the wallet private key',
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
export const GENERATORS = {
  typescript: new TypeScriptGenerator(MESSAGE_TEST_CASES),
}
