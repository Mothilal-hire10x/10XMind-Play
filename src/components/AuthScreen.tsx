import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, EnvelopeSimple, LockKey, Sparkle, CircleNotch } from '@phosphor-icons/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem, springs } from '@/lib/animations'

// Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, -15, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Magnetic button component
const MagneticButton = ({ children, className, ...props }: React.ComponentProps<typeof Button>) => {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div style={{ x: springX, y: springY }}>
      <Button
        ref={ref}
        className={className}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-3 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <FloatingParticles />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Gradient orbs */}
      <motion.div 
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-primary/30 to-blue-500/20 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-500/20 to-primary/30 blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <motion.div 
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ThemeToggle />
      </motion.div>
      <div className="w-full max-w-[95%] sm:max-w-md relative z-10">
        <motion.div 
          className="flex flex-col items-center mb-4 sm:mb-6 md:mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary via-blue-600 to-purple-600 flex items-center justify-center mb-3 sm:mb-4 shadow-xl shadow-primary/25 relative"
            variants={staggerItem}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.bouncy}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Brain size={28} className="sm:hidden text-primary-foreground relative z-10" weight="bold" />
            <Brain size={32} className="hidden sm:block md:hidden text-primary-foreground relative z-10" weight="bold" />
            <Brain size={40} className="hidden md:block text-primary-foreground relative z-10" weight="bold" />
          </motion.div>
          <motion.h1 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight flex items-center gap-1.5 sm:gap-2"
            variants={staggerItem}
          >
            <span className="bg-gradient-to-r from-blue-600 to-primary bg-clip-text text-transparent">10</span>
            <span>XMindPlay</span>
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkle size={20} className="sm:hidden text-blue-600 dark:text-blue-400" weight="fill" />
              <Sparkle size={24} className="hidden sm:block text-blue-600 dark:text-blue-400" weight="fill" />
            </motion.span>
          </motion.h1>
          <motion.p 
            className="text-sm sm:text-base text-muted-foreground mt-1.5 sm:mt-2"
            variants={staggerItem}
          >
            Cognitive Training Platform
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="shadow-2xl sm:shadow-2xl border border-border/50 sm:border-2 backdrop-blur-sm bg-card/95 overflow-hidden">
            {/* Shimmer effect on card */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" style={{ animationDelay: '1s' }} />
            <CardHeader className="space-y-1 sm:space-y-1.5 p-4 sm:p-6 relative">
              <CardTitle className="text-xl sm:text-2xl">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {isLogin ? 'Sign in to continue your training' : 'Start your cognitive training journey'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
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
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={springs.snappy}
                  >
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <MagneticButton 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all text-sm sm:text-base h-10 sm:h-11 font-semibold" 
                  disabled={loading}
                >
                  {loading ? (
                    <motion.span 
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <CircleNotch size={18} className="animate-spin" />
                      Please wait...
                    </motion.span>
                  ) : (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {isLogin ? 'Sign In' : 'Sign Up'}
                    </motion.span>
                  )}
                </MagneticButton>

                <motion.div 
                  className="text-center text-xs sm:text-sm pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setError('')
                    }}
                    className="text-primary hover:underline transition-all font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </motion.button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
