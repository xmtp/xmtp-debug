import { getContactsWithClient, crosscheckContacts, verify } from './contacts'

export default async function crosscheck(argv: any) {
  // Expect devClient, prodClient
  const { devClient, prodClient, address } = argv
  const devContacts = await getContactsWithClient(devClient, address, argv)
  const prodContacts = await getContactsWithClient(prodClient, address, argv)

  // Rows are format: check, status, message
  let rows = []
  // Use contacts.crosscheckContacts to check for dev/prod confusion
  let devProdConfusionError = crosscheckContacts(devContacts, prodContacts)
  if (devProdConfusionError) {
    rows.push({
      check: 'dev/prod confusion',
      status: 'FAIL',
      error: devProdConfusionError,
    })
  } else {
    rows.push({
      check: 'dev/prod confusion',
      status: 'PASS',
      error: `No intermixed contacts. Found ${devContacts.length} dev contacts and ${prodContacts.length} prod contacts`,
    })
  }
  console.table(rows)
  // Create artificial commands for contacts.verify on both dev and prod
  // Use contacts.verify to check for malformed contacts, this function prints its own output
  if (devContacts.length === 0) {
    console.table([
      { check: 'dev contacts', status: 'SKIP - No contacts to verify' },
    ])
  } else {
    console.table([
      { check: 'Checking dev contact bundle integrity', status: 'RUN' },
    ])
    await verify(address, devContacts)
  }
  if (prodContacts.length === 0) {
    console.table([
      { check: 'prod contacts', status: 'SKIP - No contacts to verify' },
    ])
  } else {
    console.table([
      { check: 'Checking prod contact bundle integrity', status: 'RUN' },
    ])
    await verify(address, prodContacts)
  }
}
