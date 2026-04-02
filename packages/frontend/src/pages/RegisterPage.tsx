import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signUp } from '../auth/client'
import AuthCard from '../components/Auth/AuthCard'
import FloatingLabelInput from '../components/Auth/FloatingLabelInput'
import SubmitButton from '../components/Auth/SubmitButton'
import AuthToggleLink from '../components/Auth/AuthToggleLink'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(undefined)
    setPasswordError(undefined)

    // Client-side validation per D-10
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setIsPending(true)

    const result = await signUp.email({
      email,
      password,
      name: email.split('@')[0], // Workaround: better-auth requires name, D-04 defers display name to Phase 5
    })

    if (result.error) {
      // Map error to field-specific messages per Copywriting Contract
      const errorMessage = result.error.message ?? ''
      if (
        errorMessage.toLowerCase().includes('email') ||
        errorMessage.toLowerCase().includes('user already exists')
      ) {
        setEmailError('An account with this email already exists')
      } else {
        setPasswordError('Something went wrong. Please try again.')
      }
      setIsPending(false)
      return
    }

    navigate('/feed', { replace: true })
  }

  return (
    <AuthCard title="Create account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FloatingLabelInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <FloatingLabelInput
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="8+ characters"
          error={passwordError}
        />
        <SubmitButton label="Create account" isPending={isPending} />
      </form>
      <AuthToggleLink
        prompt="Already have an account?"
        linkText="Log in"
        to="/login"
      />
    </AuthCard>
  )
}
