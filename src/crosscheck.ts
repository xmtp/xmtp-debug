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
    rows.push(['dev/prod confusion', 'FAIL', devProdConfusionError])
  } else {
    rows.push([
      'dev/prod confusion',
      'PASS',
      `No intermixed contacts. Found ${devContacts.length} dev contacts and ${prodContacts.length} prod contacts`,
    ])
  }
  console.table(rows)
  // Create artificial commands for contacts.verify on both dev and prod
  // Use contacts.verify to check for malformed contacts, this function prints its own output
  if (devContacts.length === 0) {
    console.table(['dev contacts', 'SKIP', 'No contacts to verify'])
  } else {
    await verify(address, devContacts)
  }
  if (prodContacts.length === 0) {
    console.table(['prod contacts', 'SKIP', 'No contacts to verify'])
  } else {
    await verify(address, prodContacts)
  }
}
