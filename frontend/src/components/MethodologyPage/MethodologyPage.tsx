import './MethodologyPage.css'
import RichText from '../../content/RichText'
import { useSiteContent } from '../../content/useSiteContent'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="mp-section-label">{children}</span>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mp-section-title">{children}</h2>
}

function SectionSubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mp-section-subtitle">{children}</h3>
}

function NumberBadge({ children }: { children: React.ReactNode }) {
  return <span className="mp-number-badge">{children}</span>
}

function ScoreBadge({ children, variant = 'green' }: { children: React.ReactNode; variant?: 'green' | 'gray' | 'red' }) {
  return <span className={`mp-score-badge mp-score-badge--${variant}`}>{children}</span>
}

function PercentBadge({ children, variant = 'green' }: { children: React.ReactNode; variant?: 'green' | 'gray' | 'red' }) {
  return <span className={`mp-percent-badge mp-percent-badge--${variant}`}>{children}</span>
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mp-card">{children}</div>
}

function Divider() {
  return (
    <div className="mp-container">
      <hr className="mp-divider" />
    </div>
  )
}

export default function MethodologyPage() {
  const content = useSiteContent('methodology')

  return (
    <div className="methodology-page">
      {/* Hero */}
      <section className="mp-hero">
        <div className="mp-container">
          <p className="mp-hero-subtitle">{content.updatedLabel}</p>
          <h1 className="mp-hero-title">Methodology</h1>
          <p className="mp-body">
            <RichText text={content.intro} />
          </p>
        </div>
      </section>

      <Divider />

      {/* Methodology Section */}
      <section className="mp-methodology">
        <div className="mp-container">
          <div className="mp-two-col">
            <div className="mp-col">
              <SectionLabel>ANALYSTS</SectionLabel>
              <SectionSubTitle>What Peptrace Tests</SectionSubTitle>
              <p className="mp-body">
                Peptrace samples products from vendors and sends them to third-party labs. High Performance Liquid Chromatography is the primary method requested for peptide samples. Lab results are used to evaluate identity, purity, and fill accuracy: whether the expected active substance is present, how pure it is, and how much material is in the container compared with the vendor&apos;s claim.
              </p>
              <p className="mp-body">
                Peptrace also reviews batch identification and quantity claims. Information printed directly on the vial is strongest because it ships with the product at the point of use. Physical shipment inserts can be acceptable. Website-only claims are weaker because they are separated from the product after purchase.
              </p>
            </div>
            <div className="mp-col">
              <SectionLabel>VENDORS</SectionLabel>
              <SectionSubTitle>What Vendors Can and Cannot Change</SectionSubTitle>
              <div className="mp-policy-grid">
                <Card>
                  <h4 className="mp-card-title">Tests are not altered</h4>
                  <p className="mp-card-body">
                    Peptrace does not rewrite, remove, or soften test results because a vendor objects to them. If a factual correction is needed, it is handled as a correction record; the underlying test history remains part of the evidence base.
                  </p>
                </Card>
                <Card>
                  <h4 className="mp-card-title">Rankings are not for sale</h4>
                  <p className="mp-card-body">
                    Peptrace does not accept payment to change rankings, suppress failures, promote vendors, or alter the scoring method for a vendor.
                  </p>
                </Card>
                <Card>
                  <h4 className="mp-card-title">How a vendor improves</h4>
                  <p className="mp-card-body">
                    A vendor with a poor ranking has two real paths to improvement: fix the product or process issue, then have the product tested more regularly so newer evidence can demonstrate that the problem has been resolved.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* Standards Section */}
      <section className="mp-standards">
        <div className="mp-container">
          <SectionLabel>STANDARDS</SectionLabel>
          <SectionTitle>What Counts as a Passing Sample</SectionTitle>
          <p className="mp-body">
            <RichText text={content.standardsIntro} />
          </p>

          <div className="mp-table-wrap">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Standard</th>
                  <th>Purity</th>
                  <th>Quantity</th>
                  <th>Labeling</th>
                  <th>Sometimes</th>
                </tr>
              </thead>
              <tbody>
                {content.standards.map((standard, index) => (
                  <tr key={`${index}-${standard.name}`}>
                    <td>
                      {standard.name}
                      {standard.membersOnly ? <><br />(Members)</> : null}
                    </td>
                    <td>{standard.purity}</td>
                    <td>{standard.quantity}</td>
                    <td>{standard.labeling}</td>
                    <td>{standard.sometimes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {content.standardsNotes.map((note, index) => (
            <p className="mp-body" key={index}>
              <RichText text={note} />
            </p>
          ))}
        </div>
      </section>

      <Divider />

      {/* Labeling Score — How it Works */}
      <section className="mp-labeling">
        <div className="mp-container">
          <SectionLabel>LABELING</SectionLabel>
          <SectionTitle>How the Labeling Score Works</SectionTitle>
          <p className="mp-body">
            The labeling score measures whether the sample can be tied back to a batch and whether batch-specific claims are communicated in a way that travels with the product. The score is based on what Peptrace finds on or with the sample at the time of testing - not what a vendor posts online after the fact.
          </p>

          <div className="mp-card-grid mp-card-grid--2x2">
            <Card>
              <div className="mp-card-header">
                <NumberBadge>1</NumberBadge>
                <h4 className="mp-card-title">Batch identification on the vial</h4>
              </div>
              <p className="mp-card-body">
                A lot or batch number printed directly on the vial or its label. This is the strongest form of identification because it is inseparable from the product at the point of use.
              </p>
            </Card>
            <Card>
              <div className="mp-card-header">
                <NumberBadge>2</NumberBadge>
                <h4 className="mp-card-title">COA shipped with the product</h4>
              </div>
              <p className="mp-card-body">
                A certificate of analysis included in the physical shipment. A COA that matches the batch number on the vial and specifies purity and quantity results contributes positively to the labeling score.
              </p>
            </Card>
            <Card>
              <div className="mp-card-header">
                <NumberBadge>3</NumberBadge>
                <h4 className="mp-card-title">Quantity claim on the vial</h4>
              </div>
              <p className="mp-card-body">
                A fill quantity stated on the vial label - for example, 5 mg per vial. This allows Peptrace to compare the measured fill against what the vendor claims is in the container.
              </p>
            </Card>
            <Card>
              <div className="mp-card-header">
                <NumberBadge>-</NumberBadge>
                <h4 className="mp-card-title">Website-only claims</h4>
              </div>
              <p className="mp-card-body">
                Purity or quantity figures published only on a vendor website are not credited. They are separated from the product after purchase and cannot be verified as applying to the specific vial tested.
              </p>
            </Card>
          </div>

          <p className="mp-body">
            A score of 0 means no batch-traceable labeling was found. A score of 1.0 means the vial carries a batch number and a matching COA with full results was shipped with the product. Scores in between reflect partial labeling - for example, a batch number on the vial but no accompanying COA.
          </p>
        </div>
      </section>

      <Divider />

      {/* Labeling Score — How it Is Calculated */}
      <section className="mp-labeling-calc">
        <div className="mp-container">
          <SectionLabel>LABELING</SectionLabel>
          <SectionTitle>How the Labeling Score Is Calculated</SectionTitle>

          <div className="mp-two-col">
            <div className="mp-col">
              <h4 className="mp-calc-subtitle">If only a label claim is present</h4>
              <ul className="mp-score-list">
                <li>
                  <ScoreBadge>2</ScoreBadge>
                  <span>2 points: the batch identifier is printed on the product container.</span>
                </li>
                <li>
                  <ScoreBadge>1</ScoreBadge>
                  <span>1 point: the batch identifier is provided on a separate physical support shipped with the container.</span>
                </li>
                <li>
                  <ScoreBadge>0</ScoreBadge>
                  <span>0 points: the batch identifier is website-only, purchase-page-only, or absent.</span>
                </li>
              </ul>
              <p className="mp-note-title">Methodology note</p>
              <p className="mp-note-body">
                For label-only claims, the batch identifier must be on the product container itself to earn 2 points. A separate insert or packaging insert shipped with the container is scored as 1 point.
              </p>
            </div>
            <div className="mp-col">
              <h4 className="mp-calc-subtitle">If both a label claim and batch claim are present</h4>
              <p className="mp-body">
                The score is the sum of two parts: batch-identifier quality and batch claim communication quality.
              </p>
              <div className="mp-mini-card">
                <h5 className="mp-mini-card-title">Batch identifier</h5>
                <p className="mp-mini-card-body">
                  2 if printed on the container, 1 if on a separate physical support, 0 if website-only or absent.
                </p>
              </div>
              <div className="mp-mini-card">
                <h5 className="mp-mini-card-title">Batch claim communication</h5>
                <p className="mp-mini-card-body">
                  2 if printed on the container, 1 if on a separate physical support, 0 if website-only or absent.
                </p>
              </div>
              <p className="mp-body">
                For Peptrace Standard and Accuracy focus, a score of 0.5 or higher is acceptable. For Peptrace Super strict, a score of 1.0 or higher is required. Purity focus modes do not apply the labeling score.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* Rating Percent — Natural Rating vs Final Rating */}
      <section className="mp-rating">
        <div className="mp-container">
          <SectionLabel>RATING PERCENT</SectionLabel>
          <SectionTitle>Natural Rating vs Final Rating</SectionTitle>
          <p className="mp-body">
            Peptrace shows two related ideas: the natural rating and the final rating. The natural rating is closest to the raw evidence. The final rating is what leaderboards use, because it handles thin data more carefully.
          </p>

          <div className="mp-card-grid mp-card-grid--3">
            <Card>
              <div className="mp-card-header">
                <NumberBadge>1</NumberBadge>
                <h4 className="mp-card-title">Classify each sample</h4>
              </div>
              <p className="mp-card-body">
                Each test is marked pass, fail, or incomplete under the selected standard. Incomplete tests are shown in the test history but do not count toward that standard&apos;s pass rate.
              </p>
            </Card>
            <Card>
              <div className="mp-card-header">
                <NumberBadge>2</NumberBadge>
                <h4 className="mp-card-title">Weight recent evidence more</h4>
              </div>
              <p className="mp-card-body">
                Newer tests count more than older tests. The current evidence half-life is 730 days, so a test that old counts about half as much as a new test.
              </p>
            </Card>
            <Card>
              <div className="mp-card-header">
                <NumberBadge>3</NumberBadge>
                <h4 className="mp-card-title">Adjust thin histories</h4>
              </div>
              <p className="mp-card-body">
                If a vendor has a small number of classifiable tests for a peptide, the final rating is pulled toward the peer baseline for that peptide. This prevents one lucky or unlucky test from looking too certain.
              </p>
            </Card>
          </div>

          <p className="mp-body">
            The natural rating is the direct pass rate after time-weighting. The final rating adds the thin-data adjustment on top. For peptides with many tests across a vendor, the two numbers converge. For peptides with few tests, the final rating will sit closer to the overall peptide average until more evidence accumulates.
          </p>
        </div>
      </section>

      <Divider />

      {/* Rating Percent — The Formulas */}
      <section className="mp-formulas">
        <div className="mp-container">
          <SectionLabel>RATING PERCENT</SectionLabel>
          <SectionTitle>The Formulas</SectionTitle>

          <div className="mp-card-grid mp-card-grid--3">
            <Card>
              <h4 className="mp-formula-title">TIME WEIGHTING</h4>
              <p className="mp-formula">wₜ = 2^(−Δt/τ)</p>
              <p className="mp-formula-desc">
                Each test is weighted by recency. Δt is days since the test, τ is the half-life (730 days). A test done today has weight 1; a test 730 days ago has weight 0.5.
              </p>
            </Card>
            <Card>
              <h4 className="mp-formula-title">NATURAL RATING</h4>
              <p className="mp-formula">R_natural = Σ(wₜ × passₜ) / Σwₜ</p>
              <p className="mp-formula-desc">
                The time-weighted pass rate across all classifiable tests for a vendor-peptide pair under the selected standard.
              </p>
            </Card>
            <Card>
              <h4 className="mp-formula-title">POSTERIOR MEAN</h4>
              <p className="mp-formula">R_mean = (Σwₜ × R_natural + α × R_prior) / (Σwₜ + α)</p>
              <p className="mp-formula-desc">
                The final rating blends the vendor&apos;s own evidence with the peptide-level prior. α controls how strongly thin histories are pulled toward the baseline.
              </p>
            </Card>
            <Card>
              <h4 className="mp-formula-title">PRIOR STRENGTH</h4>
              <p className="mp-formula">α ∈ [0, 20]</p>
              <p className="mp-formula-desc">
                The prior strength α is set to 8 equivalent tests by default. A vendor needs roughly 8 passing classifiable tests before the final rating converges closely to the natural rating.
              </p>
            </Card>
            <Card>
              <h4 className="mp-formula-title">EVIDENCE PRIOR DECAY</h4>
              <p className="mp-formula">τ_product = 24 / (1 + Σwₜ / τ_0)</p>
              <p className="mp-formula-desc">
                The product evidence scale also shortens that half-life for thinner boards, so their prior decays sooner as new evidence accumulates.
              </p>
            </Card>
            <Card>
              <h4 className="mp-formula-title">PRODUCT EVIDENCE SCALE</h4>
              <p className="mp-formula">τ_product = clamp(M_product / M_p0, 0.3, 1)</p>
              <p className="mp-formula-desc">
                Peptides with fewer total tests across all vendors use a compressed scale. This prevents sparse peptides from appearing overconfident relative to well-tested ones.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Divider />

      {/* Reading Results */}
      <section className="mp-reading">
        <div className="mp-container">
          <SectionLabel>READING RESULTS</SectionLabel>
          <SectionTitle>How to Read the Final Rating</SectionTitle>
          <p className="mp-body">
            As a vendor accumulates more recent classifiable tests, the final rating moves closer to its natural rating. With limited evidence, the adjustment is stronger. Mature product boards can start at up to 24 peer-baseline pseudo-samples, while thinner product boards scale that prior down based on their median vendor evidence.
          </p>
          <p className="mp-body">
            The base evidence half-life is 8 effective tests. The same product evidence scale also shortens that half-life for thinner boards, so their prior decays sooner.
          </p>

          <div className="mp-card-grid mp-card-grid--3">
            <Card>
              <div className="mp-card-header">
                <PercentBadge>90%</PercentBadge>
                <h4 className="mp-card-title">Strong pass rate</h4>
              </div>
              <p className="mp-card-body">
                90% or above indicates that recent, classifiable samples have very consistently met the selected Peptrace standard. The vendor has sufficient test volume for this to be a reliable signal.
              </p>
            </Card>
            <Card>
              <div className="mp-card-header">
                <PercentBadge variant="gray">50%</PercentBadge>
                <h4 className="mp-card-title">Near baseline</h4>
              </div>
              <p className="mp-card-body">
                A rating near 50% may mean a mixed testing record, or it may reflect a thin evidence base being pulled toward the peptide average. Check the test count for context.
              </p>
            </Card>
            <Card>
              <div className="mp-card-header">
                <PercentBadge variant="red">20%</PercentBadge>
                <h4 className="mp-card-title">Consistent failures</h4>
              </div>
              <p className="mp-card-body">
                20% or below indicates that most recent, classifiable tests have failed the standard. Even with thin evidence, repeated failures pull the rating well below the peptide baseline.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Divider />

      {/* Leaderboard */}
      <section className="mp-leaderboard">
        <div className="mp-container">
          <SectionLabel>LEADERBOARD</SectionLabel>
          <SectionTitle>How Rankings Are Ordered</SectionTitle>
          <p className="mp-body">
            Vendors are ranked on each peptide leaderboard by their final rating under the selected standard. Ties are broken by the number of classifiable tests - more evidence ranks higher.
          </p>

          <Card>
            <h4 className="mp-card-title">Bad results stay visible</h4>
            <p className="mp-card-body">
              A vendor&apos;s ranking is based on their final rating, which takes into account all their test history. This means that past failures remain visible and impact their score until they are replaced by fresh passing tests.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}
