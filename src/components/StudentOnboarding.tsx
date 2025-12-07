import { useState, useEffect } from 'react'
import { StudyInformation } from './StudyInformation'
import { InformedConsent } from './InformedConsent'
import { Dashboard } from './Dashboard'
import { useAuth } from '@/lib/auth-context'
import { authAPI } from '@/lib/api-client'

type OnboardingStep = 'study-info' | 'consent' | 'complete'

interface StudentOnboardingProps {
  onSelectGame: (gameId: string) => void
  onViewResults: () => void
}

export function StudentOnboarding({ onSelectGame, onViewResults }: StudentOnboardingProps) {
  const { user, logout, refreshUser } = useAuth()
  const [step, setStep] = useState<OnboardingStep>(() => {
    // If user already has consent date, skip onboarding
    // Check for both null/undefined and empty string
    console.log('StudentOnboarding - Initial check:', { 
      consentDate: user?.consentDate, 
      hasConsent: !!(user?.consentDate && user.consentDate.trim() !== '')
    })
    if (user?.consentDate && user.consentDate.trim() !== '') {
      return 'complete'
    }
    return 'study-info'
  })

  // Update step when user changes (e.g., after refresh)
  useEffect(() => {
    console.log('StudentOnboarding - User changed:', { 
      consentDate: user?.consentDate, 
      currentStep: step,
      hasConsent: !!(user?.consentDate && user.consentDate.trim() !== '')
    })
    if (user?.consentDate && user.consentDate.trim() !== '' && step !== 'complete') {
      console.log('StudentOnboarding - Moving to complete step')
      setStep('complete')
    }
  }, [user?.consentDate, step])

  const handleStudyInfoContinue = () => {
    setStep('consent')
  }

  const handleConsent = async (consentData: { name: string; date: string }) => {
    try {
      // Update user with consent information
      await authAPI.updateConsent(consentData.date)
      
      // Refresh user data to get updated consent date
      if (refreshUser) {
        await refreshUser()
      }
      
      // Move to complete step
      setStep('complete')
    } catch (error) {
      console.error('Failed to save consent:', error)
      // Still proceed but log the error
      setStep('complete')
    }
  }

  const handleDecline = () => {
    // User declined consent, log them out
    logout()
  }

  const handleExit = () => {
    logout()
  }

  if (step === 'study-info') {
    return <StudyInformation onContinue={handleStudyInfoContinue} onExit={handleExit} />
  }

  if (step === 'consent') {
    return (
      <InformedConsent
        userName={user?.name || ''}
        onConsent={handleConsent}
        onDecline={handleDecline}
      />
    )
  }

  // step === 'complete'
  return <Dashboard onSelectGame={onSelectGame} onViewResults={onViewResults} />
}
