interface TestItem {
  date: string
  result: 'PASS' | 'FAIL'
  productName: string
  vendorName: string
  labName: string
  purity: number | null
  identityPass: boolean
  dosageDeviation: string | null
  testedMg: number | null
  labelMg: number | null
  batch: string
  sender: string
  coaUrl: string | null
}

interface TestHistorySectionProps {
  productName: string
  stats: { total: number; pass: number; fail: number }
  tests: TestItem[]
  loading?: boolean
  error?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export default function TestHistorySection({ productName, stats, tests, loading, error }: TestHistorySectionProps) {
  return (
    <div className="fl-test-history">
      <div className="fl-test-history-header">
        <div className="fl-test-history-title-area">
          <h2 className="fl-test-history-title">{productName} test history</h2>
          <p className="fl-test-history-stats">
            {stats.total} TESTS · <span className="fl-pass-count">{stats.pass} PASS</span> ·{' '}
            <span className="fl-fail-count">{stats.fail} FAIL</span>
          </p>
        </div>
        <span className="fl-coa-badge">
          <span className="fl-coa-dot" />
          COA-BACKED LAB TESTS
        </span>
      </div>

      <div className="fl-test-table-wrap">
        {loading && (
          <div className="fl-test-empty">
            <span className="fl-spinner" role="status" aria-label="Loading" />
            <span>Loading test history…</span>
          </div>
        )}
        {!loading && error && (
          <div className="fl-test-empty">Unable to load test history. Please try again later.</div>
        )}
        {!loading && !error && (
          <table className="fl-test-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>RESULT</th>
                <th>TEST</th>
                <th>LAB</th>
                <th>PURITY</th>
                <th>DOSAGE</th>
                <th>LABEL</th>
                <th>COA</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((item, i) => (
                <tr key={i}>
                  <td>{formatDate(item.date)}</td>
                  <td>
                    <span className={`fl-result ${item.result.toLowerCase()}`}>
                      <span className="fl-result-dot" />
                      {item.result === 'PASS' ? 'Pass' : 'Fail'}
                    </span>
                    {item.result === 'FAIL' && (
                      <span className="fl-fail-reason">purity below standard</span>
                    )}
                  </td>
                  <td>
                    <div className="fl-test-name">{item.productName}</div>
                    <div className="fl-test-vendor">{item.vendorName}</div>
                  </td>
                  <td>
                    <span className="fl-lab-badge">{item.labName}</span>
                  </td>
                  <td>
                    {item.purity ?? '—'}%
                    {item.identityPass && <div className="fl-identity-pass">identity Pass</div>}
                  </td>
                  <td>{item.dosageDeviation ?? '—'}</td>
                  <td>
                    {item.testedMg ?? '—'} / {item.labelMg ?? '—'} mg
                    <div className="fl-batch">{item.batch}</div>
                  </td>
                  <td>
                    {item.coaUrl ? (
                      <a href={item.coaUrl} className="fl-coa-link">VIEW COA</a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
