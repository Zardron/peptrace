import './VendorsList.css'
import searchIcon from '../../assets/vendors/search.svg'
import chevronDown from '../../assets/vendors/chevron-down.svg'
import { vendorData } from '../../data/vendorData'

function scoreClass(score: number): string {
  if (score >= 70) return 'score-high'
  if (score >= 60) return 'score-mid'
  return 'score-low'
}

export default function VendorsList() {
  return (
    <div className="vendors-list">
      <div className="vendors-list-inner">
        <div className="vendors-title-area">
          <h1 className="vendors-title">Vendors</h1>
          <p className="vendors-subtitle">
            1,729 vendors · total score by Purity focus
          </p>
        </div>

        <div className="vendors-toolbar">
          <div className="vendors-toolbar-left">
            <div className="vendors-search">
              <img src={searchIcon} alt="" className="vendors-search-icon" />
              <input
                type="text"
                className="vendors-search-input"
                placeholder="Search vendor, drug, or location"
              />
            </div>
            <button type="button" className="vendors-dropdown">
              <span>Purity focus · purity 99.0%+, cbar ≥55%</span>
              <img src={chevronDown} alt="" className="vendors-chevron" />
            </button>
          </div>
          <a href="/methodology" className="vendors-methodology">
            methodology →
          </a>
        </div>

        <div className="vendors-table-wrap">
          <div className="vendors-table">
            <div className="vendors-table-header">
              <span className="col-num">#</span>
              <span className="col-vendor">VENDOR</span>
              <span className="col-score">SCORE</span>
              <span className="col-cost">COST</span>
              <span className="col-tests">TESTS</span>
              <span className="col-products">PRODUCTS</span>
              <span className="col-latest">LATEST</span>
              <span className="col-location">LOCATION</span>
            </div>
            {vendorData.map((row) => (
              <div key={row.id} className="vendors-table-row">
                <span className="col-num">{row.id}</span>
                <span className="col-vendor">
                  <span className="vendor-avatar" />
                  <span className="vendor-name">{row.name}</span>
                </span>
                <span className="col-score">
                  <span className={`score-badge ${scoreClass(row.score)}`}>
                    {row.score}%
                  </span>
                </span>
                <span className="col-cost">{row.cost}</span>
                <span className="col-tests">{row.tests}</span>
                <span className="col-products">{row.products}</span>
                <span className="col-latest">{row.latest}</span>
                <span className="col-location">{row.location}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
