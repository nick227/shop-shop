/**
 * Login Form Header Component
 * Extracted header section with visual cues
 */
import { VisualCue } from '../../Enhancements/VisualHierarchy'

export function LoginFormHeader() {
  return (
    <div className="text-center space-y-2">
      <VisualCue cue="highlight" position="center" color="primary" animated>
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
      </VisualCue>
      <p className="text-muted-foreground">Sign in to your account</p>
    </div>
  )
}
