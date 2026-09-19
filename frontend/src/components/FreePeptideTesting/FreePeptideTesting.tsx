import { useState } from 'react'
import './FreePeptideTesting.css'
import arrowRight from '../../assets/arrow-right.svg'

const productCards = ['Tirzepatide', 'Tirzepatide', 'Tirzepatide']

const paidProducts = [
  { name: 'Tirzepatide', price: 'FREE' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
]

export default function FreePeptideTesting() {
  const [selectedCard, setSelectedCard] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRow, setSelectedRow] = useState<number | null>(0)

  const filteredProducts = paidProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="free-peptide-testing">
      <section className="fpt-hero">
        <div className="fpt-hero-inner">
          <h1 className="fpt-hero-title">Free Peptide Testing</h1>
          <div className="fpt-info-block">
            <div className="fpt-info-icon">
              <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 0C7.387 0 0 7.387 0 16.5C0 25.613 7.387 33 16.5 33C25.613 33 33 25.613 33 16.5C33 7.387 25.613 0 16.5 0ZM16.5 30C9.056 30 3 23.944 3 16.5C3 9.056 9.056 3 16.5 3C23.944 3 30 9.056 30 16.5C30 23.944 23.944 30 16.5 30Z" fill="#45a382"/>
                <path d="M14.5 9.5H18.5V13.5H14.5V9.5ZM14.5 16.5H18.5V24.5H14.5V16.5Z" fill="#45a382"/>
              </svg>
            </div>
            <div className="fpt-info-text">
              <p className="fpt-info-title">Free testing is only available for individuals</p>
              <p className="fpt-info-body">
                If you are a vendor or if you sell or distribute peptides to others professionally, please use our Vendor Services. This allows us to keep providing testing at no cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="fpt-wizard">
        <div className="fpt-wizard-inner">
          <div className="fpt-step-header">
            <span className="fpt-step-label">Step 1 of 7</span>
            <div className="fpt-progress-bars">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`fpt-progress-bar ${i === 0 ? 'active' : ''}`} />
              ))}
            </div>
            <div className="fpt-step-title-row">
              <span className="fpt-step-name">Choose Product</span>
              <span className="fpt-step-price">
                <span className="fpt-price-label">Price:</span>
                <span className="fpt-price-value">FREE</span>
              </span>
            </div>
          </div>

          <div className="fpt-section-title">
            <span>What product are you sending us?</span>
          </div>

          <div className="fpt-product-select">
            {productCards.map((name, i) => (
              <button
                key={i}
                type="button"
                className={`fpt-product-chip ${selectedCard === i ? 'selected' : ''}`}
                onClick={() => setSelectedCard(i)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="fpt-paid-products">
            <div className="fpt-search-wrap">
              <input
                type="text"
                className="fpt-search-input"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="fpt-product-list">
              {filteredProducts.map((product, i) => (
                <div
                  key={i}
                  className={`fpt-product-row ${selectedRow === i ? 'selected' : ''} ${i % 2 === 1 ? 'alt' : ''}`}
                  onClick={() => setSelectedRow(i)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="fpt-row-name">{product.name}</span>
                  <span className="fpt-row-price">{product.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fpt-wizard-actions">
            <button type="button" className="fpt-next-button">
              <span>Next</span>
              <img src={arrowRight} alt="" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
