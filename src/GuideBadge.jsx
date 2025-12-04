import React, { useState } from 'react'
import './GuideBadge.css'

export default function GuideBadge({ step, totalSteps, instruction, details, onClose }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`guide-badge ${expanded ? 'expanded' : ''}`}>
      <div className="guide-badge-header" onClick={() => setExpanded(!expanded)}>
        <div className="guide-badge-step">{step}/{totalSteps}</div>
        <div className="guide-badge-instruction">{instruction}</div>
        <button className="guide-badge-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>
          ✕
        </button>
      </div>
      
      {expanded && (
        <div className="guide-badge-details">
          <p>{details}</p>
        </div>
      )}
    </div>
  )
}
