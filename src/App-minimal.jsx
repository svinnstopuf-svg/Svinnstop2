import React from 'react'

export default function App() {
  console.log('MINIMAL APP: React is running')
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      color: 'black',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{color: 'red'}}>🔥 TEST: React fungerar!</h1>
      <p>Om du ser denna text fungerar React.</p>
      <button 
        onClick={() => alert('JavaScript fungerar!')}
        style={{
          padding: '10px 20px',
          backgroundColor: 'green',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Testa JavaScript
      </button>
      
      <div style={{marginTop: '20px'}}>
        <h2>Browser info:</h2>
        <p>User Agent: {navigator.userAgent}</p>
        <p>URL: {window.location.href}</p>
        <p>Tid: {new Date().toString()}</p>
      </div>
    </div>
  )
}