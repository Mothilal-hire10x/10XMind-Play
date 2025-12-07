import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, EnvelopeSimple, LockKey, Sparkle } from '@phosphor-icons/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!isLogin && (!rollNo || !name || !dob)) {
      setError('Please fill all required fields')
      setLoading(false)
      return
    }

    const success = isLogin 
      ? await login(email, password) 
      : await signup(email, password, rollNo, name, dob) // Don't pass consentDate during signup

    if (!success) {
      setError(isLogin ? 'Invalid email or password' : 'Email already registered')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <motion.div 
        className="absolute top-4 right-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ThemeToggle />
      </motion.div>
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-blue-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Brain size={32} weight="bold" className="text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400">10</span>XMindPlay
            <Sparkle size={20} weight="fill" className="text-blue-600 dark:text-blue-400" />
          </h1>
          <p className="text-muted-foreground mt-2">Cognitive Training Platform</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="text-2xl">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
              <CardDescription>
                {isLogin ? 'Sign in to continue your training' : 'Start your cognitive training journey'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {!isLogin && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="rollNo">
                        Roll Number *
                      </Label>
                      <Input
                        id="rollNo"
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="Enter your roll number"
                        className="transition-all focus:border-primary"
                        required={!isLogin}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="name">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="transition-all focus:border-primary"
                        required={!isLogin}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="dob">
                        Date of Birth *
                      </Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="transition-all focus:border-primary"
                        required={!isLogin}
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <EnvelopeSimple size={16} weight="duotone" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="transition-all focus:border-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <LockKey size={16} weight="duotone" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="transition-all focus:border-primary"
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md transition-all" 
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
                </Button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setError('')
                    }}
                    className="text-primary hover:underline transition-all"
                  >
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
