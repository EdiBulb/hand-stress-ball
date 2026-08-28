import { useEffect, useState } from 'react'
import { fetchApprovedBalls, type GalleryBall } from '../lib/ballsApi'
import {
  UnauthorizedError,
  approveBall,
  clearStoredSecret,
  fetchPendingBalls,
  getStoredSecret,
  rejectBall,
  storeSecret,
} from '../lib/moderationApi'
import './ModeratePage.css'

// Hidden review page at /moderate. Not linked from anywhere in the app --
// only reachable by typing the URL. Protected by a shared secret (see
// api/_lib/auth.ts) entered once and kept in sessionStorage.
export function ModeratePage() {
  const [secret, setSecret] = useState<string | null>(() => getStoredSecret())
  const [balls, setBalls] = useState<GalleryBall[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [approvedBalls, setApprovedBalls] = useState<GalleryBall[]>([])
  const [approvedStatus, setApprovedStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  useEffect(() => {
    if (!secret) return
    void loadPending(secret)
    void loadApproved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret])

  async function loadPending(currentSecret: string) {
    setStatus('loading')
    setError('')
    try {
      const list = await fetchPendingBalls(currentSecret)
      setBalls(list)
      setStatus('idle')
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearStoredSecret()
        setSecret(null)
        setError('Wrong secret. Try again.')
        setStatus('idle')
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load pending balls.')
      setStatus('error')
    }
  }

  async function loadApproved() {
    setApprovedStatus('loading')
    try {
      const list = await fetchApprovedBalls()
      setApprovedBalls(list)
      setApprovedStatus('idle')
    } catch {
      setApprovedStatus('error')
    }
  }

  function handleSecretSubmit(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    storeSecret(trimmed)
    setSecret(trimmed)
  }

  async function handleApprove(id: string) {
    if (!secret) return
    setPendingAction(id)
    try {
      await approveBall(id, secret)
      setBalls((prev) => prev.filter((ball) => ball.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleReject(id: string) {
    if (!secret) return
    setPendingAction(id)
    try {
      await rejectBall(id, secret)
      setBalls((prev) => prev.filter((ball) => ball.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDeleteApproved(id: string, name: string) {
    if (!secret) return
    if (!window.confirm(`Delete "${name}"? It will disappear from the gallery immediately.`)) return
    setPendingAction(id)
    try {
      // Same endpoint as reject -- it deletes the record regardless of
      // approval status, so it works for already-live balls too.
      await rejectBall(id, secret)
      setApprovedBalls((prev) => prev.filter((ball) => ball.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.')
    } finally {
      setPendingAction(null)
    }
  }

  if (!secret) {
    return <SecretForm error={error} onSubmit={handleSecretSubmit} />
  }

  return (
    <div className="moderate-page">
      <header className="moderate-header">
        <h1>Review queue</h1>
        <button
          className="btn-secondary"
          onClick={() => {
            clearStoredSecret()
            setSecret(null)
          }}
        >
          Log out
        </button>
      </header>

      {error && <p className="upload-error">{error}</p>}

      {status === 'loading' && <p>Loading...</p>}
      {status === 'idle' && balls.length === 0 && <p>Nothing waiting for review.</p>}

      <div className="moderate-grid">
        {balls.map((ball) => (
          <div className="moderate-card" key={ball.id}>
            <img className="moderate-thumb" src={ball.imageUrl} alt={ball.name} />
            <div className="moderate-name">{ball.name}</div>
            <div className="gallery-creator">by {ball.creatorName}</div>
            <div className="moderate-actions">
              <button
                className="btn-primary"
                disabled={pendingAction === ball.id}
                onClick={() => void handleApprove(ball.id)}
              >
                Approve
              </button>
              <button
                className="btn-secondary"
                disabled={pendingAction === ball.id}
                onClick={() => void handleReject(ball.id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <header className="moderate-header">
        <h1>Live in the gallery</h1>
      </header>

      {approvedStatus === 'loading' && <p>Loading...</p>}
      {approvedStatus === 'error' && <p className="upload-error">Failed to load the gallery list.</p>}
      {approvedStatus === 'idle' && approvedBalls.length === 0 && <p>Nothing approved yet.</p>}

      <div className="moderate-grid">
        {approvedBalls.map((ball) => (
          <div className="moderate-card" key={ball.id}>
            <img className="moderate-thumb" src={ball.imageUrl} alt={ball.name} />
            <div className="moderate-name">{ball.name}</div>
            <div className="gallery-creator">by {ball.creatorName}</div>
            <div className="moderate-actions">
              <button
                className="btn-secondary"
                disabled={pendingAction === ball.id}
                onClick={() => void handleDeleteApproved(ball.id, ball.name)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SecretForm({ error, onSubmit }: { error: string; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="moderate-page moderate-login">
      <form
        className="upload-panel"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(value)
        }}
      >
        <h1>Moderation</h1>
        <input
          type="password"
          placeholder="Secret"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        {error && <p className="upload-error">{error}</p>}
        <button className="btn-primary" type="submit">
          Enter
        </button>
      </form>
    </div>
  )
}
