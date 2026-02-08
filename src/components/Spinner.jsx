import React from 'react'
import { Loader2 } from 'lucide-react'
import './Spinner.css'

export default function Spinner({ size = 24, text = '' }) {
  return (
    <div className="spinner-container">
      <Loader2 size={size} className="spinner-icon" />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  )
}
