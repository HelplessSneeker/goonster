import { Link } from 'react-router'

interface AuthToggleLinkProps {
  prompt: string
  linkText: string
  to: string
}

export default function AuthToggleLink({ prompt, linkText, to }: AuthToggleLinkProps) {
  return (
    <p className="mt-6 text-center text-sm text-white/60">
      {prompt}{' '}
      <Link to={to} className="text-white underline">
        {linkText}
      </Link>
    </p>
  )
}
