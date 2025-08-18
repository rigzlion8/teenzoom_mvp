"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestFormPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Test form submitted with name:', name)
    setLoading(true)
    setResult('')

    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `${window.location.origin}/api/test`
        : '/api/test'
      
      console.log('Making API call to:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, timestamp: new Date().toISOString() })
      })

      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        setResult(`Success: ${JSON.stringify(data, null, 2)}`)
      } else {
        const error = await response.json().catch(() => 'Unknown error')
        console.log('API error response:', error)
        setResult(`Error: ${JSON.stringify(error, null, 2)}`)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setResult(`Exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Form - Debug API Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  console.log('Name input changed:', e.target.value)
                  setName(e.target.value)
                }}
                placeholder="Enter a name..."
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  console.log('Test button clicked')
                  console.log('Current name:', name)
                  console.log('Form validation:', name.trim() ? 'Valid' : 'Invalid')
                }}
              >
                Test Button
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">{result}</pre>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
            <p><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
