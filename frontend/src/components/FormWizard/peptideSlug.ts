export const slugifyPeptideName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const getRequestedPeptideId = <T extends { id: string; name: string }>(
  peptides: T[],
  requestedSlug: string | null,
): string | null => {
  const normalizedRequestedSlug = requestedSlug?.trim().toLowerCase() ?? null

  if (!normalizedRequestedSlug) {
    return null
  }

  return peptides.find((peptide) => slugifyPeptideName(peptide.name) === normalizedRequestedSlug)?.id ?? null
}
