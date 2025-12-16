import { useState } from 'react'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  const loadProducts = async () => {
    try {
      setError('')
      const res = await fetch('http://localhost:3000/api/products')
      const data = await res.json()

      if (!data?.success) {
        setError('Failed to load products')
        return
      }

      setProducts(data.data ?? [])
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Failed to load products')
    }
  }

  return (
    <div className="app">
      <h1>E-commerce Web</h1>
      <button onClick={loadProducts}>Load products</button>

      {error ? <p className="error">{error}</p> : null}

      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - ${product.priceUSD} - Stock: {product.stock}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App

