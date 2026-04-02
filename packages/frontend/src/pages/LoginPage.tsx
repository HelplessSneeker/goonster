import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signIn } from '../auth/client'
import AuthCard from '../components/Auth/AuthCard'
import FloatingLabelInput from '../components/Auth/FloatingLabelInput'
import SubmitButton from '../components/Auth/SubmitButton'
import AuthToggleLink from '../components/Auth/AuthToggleLink'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const result = await signIn.email({ email, password })

    if (result.error) {
      setError('Incorrect email or password')
      setIsPending(false)
      return
    }

    navigate('/feed', { replace: true })
  }

  return (
    <AuthCard title="Log in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FloatingLabelInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FloatingLabelInput
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="8+ characters"
          error={error ?? undefined}
        />
        <SubmitButton label="Log in" isPending={isPending} />
      </form>
      <AuthToggleLink
        prompt="Don't have an account?"
        linkText="Register"
        to="/register"
      />
    </AuthCard>
  )
}
