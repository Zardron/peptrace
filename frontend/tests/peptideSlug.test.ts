import test from 'node:test'
import assert from 'node:assert/strict'

import { getRequestedPeptideId, slugifyPeptideName } from '../src/components/FormWizard/peptideSlug.ts'

test('slugifyPeptideName converts names to matching product URL slugs', () => {
  assert.equal(slugifyPeptideName('NAD+'), 'nad')
  assert.equal(slugifyPeptideName('BPC-157'), 'bpc-157')
  assert.equal(slugifyPeptideName('Ipamoreline'), 'ipamoreline')
})

test('getRequestedPeptideId picks the peptide whose slug matches the testing query param', () => {
  const peptides = [
    { id: 'pep-1', name: 'Ipamoreline' },
    { id: 'pep-2', name: 'NAD+' },
    { id: 'pep-3', name: 'Retatrutide' },
  ]

  assert.equal(getRequestedPeptideId(peptides, 'ipamoreline'), 'pep-1')
  assert.equal(getRequestedPeptideId(peptides, 'nad'), 'pep-2')
  assert.equal(getRequestedPeptideId(peptides, 'missing-product'), null)
})
