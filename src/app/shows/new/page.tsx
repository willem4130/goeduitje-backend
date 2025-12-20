'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewShow() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    bandId: 'full-band',
    title: '',
    date: '',
    time: '20:00',
    venueName: '',
    venueCity: '',
    venueCountry: 'Netherlands',
    venueAddress: '',
    ticketUrl: '',
    soldOut: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/shows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      router.push('/')
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ marginBottom: '30px' }}>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>← Back to Shows</Link>
        <h1 style={{ marginTop: '10px' }}>Add New Show</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Band</label>
          <select
            value={formData.bandId}
            onChange={e => setFormData({ ...formData, bandId: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            required
          >
            <option value="full-band">The Dutch Queen (Full Band)</option>
            <option value="unplugged">The Dutch Queen Unplugged</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Show Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., The Dutch Queen Live at Paradiso"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Venue Name</label>
          <input
            type="text"
            value={formData.venueName}
            onChange={e => setFormData({ ...formData, venueName: e.target.value })}
            placeholder="e.g., Paradiso"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>City</label>
            <input
              type="text"
              value={formData.venueCity}
              onChange={e => setFormData({ ...formData, venueCity: e.target.value })}
              placeholder="e.g., Amsterdam"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Country</label>
            <input
              type="text"
              value={formData.venueCountry}
              onChange={e => setFormData({ ...formData, venueCountry: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Venue Address (optional)</label>
          <input
            type="text"
            value={formData.venueAddress}
            onChange={e => setFormData({ ...formData, venueAddress: e.target.value })}
            placeholder="e.g., Weteringschans 6-8, 1017 SG Amsterdam"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ticket URL (optional)</label>
          <input
            type="url"
            value={formData.ticketUrl}
            onChange={e => setFormData({ ...formData, ticketUrl: e.target.value })}
            placeholder="https://..."
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.soldOut}
              onChange={e => setFormData({ ...formData, soldOut: e.target.checked })}
            />
            Sold Out
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Add Show
          </button>
          <Link
            href="/"
            style={{
              padding: '12px 24px',
              background: '#eee',
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
