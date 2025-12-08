import { useAuth } from '@/lib/auth-context'
import { GAMES } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Eye, TreeStructure, Lightning, ChartLine, SignOut, Sparkle, PlayCircle, Cube, Ear, User, EnvelopeSimple, IdentificationCard, Calendar, CalendarCheck, ArrowRight } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState, useRef } from 'react'
import { Separator } from '@/components/ui/separator'
import { staggerContainer, staggerItem, springs, hoverLift } from '@/lib/animations'

// Animated background grid
const AnimatedGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
    <motion.div
      className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
      animate={{
        x: [0, 50, 0],
        y: [0, 30, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
      animate={{
        x: [0, -50, 0],
        y: [0, -30, 0],
        scale: [1.1, 1, 1.1],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
)

// Magnetic card wrapper
const MagneticCard = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  
  const springConfig = { stiffness: 300, damping: 25 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    
    x.set(mouseX * 0.05)
    y.set(mouseY * 0.05)
    rotateX.set(mouseY * -0.02)
    rotateY.set(mouseX * 0.02)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ 
        x: springX, 
        y: springY,
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

const iconMap = {
  Brain,
  Eye,
  TreeStructure,
  Lightning,
  Cube,
  Ear
}

interface DashboardProps {
  onSelectGame: (gameId: string) => void
  onViewResults: () => void
}

export function Dashboard({ onSelectGame, onViewResults }: DashboardProps) {
  const { user, logout } = useAuth()
  const [showProfile, setShowProfile] = useState(false)

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap] || Brain
    return Icon
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'memory':
        return 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
      case 'attention':
        return 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
      case 'executive':
        return 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getCardGradient = (category: string) => {
    switch (category) {
      case 'memory':
        return 'hover:border-purple-500/50'
      case 'attention':
        return 'hover:border-blue-500/50'
      case 'executive':
        return 'hover:border-orange-500/50'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedGrid />
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 md:py-4 flex items-center justify-between gap-2">
          <motion.div 
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex-shrink-0 rounded-full bg-gradient-to-br from-primary via-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25 relative"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={springs.bouncy}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Brain size={18} className="sm:hidden text-primary-foreground relative z-10" weight="bold" />
              <Brain size={20} className="hidden sm:block md:hidden text-primary-foreground relative z-10" weight="bold" />
              <Brain size={24} className="hidden md:block text-primary-foreground relative z-10" weight="bold" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">
                <span className="bg-gradient-to-r from-blue-600 to-primary bg-clip-text text-transparent">10</span>XMindPlay
              </h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{user?.email}</p>
            </div>
          </motion.div>
          <motion.div 
            className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" size="sm" onClick={() => setShowProfile(true)} className="gap-1.5 sm:gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all h-8 sm:h-9 px-2 sm:px-3 backdrop-blur-sm">
                <User size={16} className="sm:hidden" weight="duotone" />
                <User size={18} className="hidden sm:block" weight="duotone" />
                <span className="hidden md:inline text-sm">Profile</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" size="sm" onClick={onViewResults} className="gap-1.5 sm:gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all h-8 sm:h-9 px-2 sm:px-3 backdrop-blur-sm">
                <ChartLine size={16} className="sm:hidden" weight="duotone" />
                <ChartLine size={18} className="hidden sm:block" weight="duotone" />
                <span className="hidden sm:inline text-sm">Results</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 sm:gap-2 hover:bg-destructive/10 hover:text-destructive transition-all h-8 sm:h-9 px-2 sm:px-3">
                <SignOut size={16} className="sm:hidden" weight="duotone" />
                <SignOut size={18} className="hidden sm:block" weight="duotone" />
                <span className="hidden md:inline text-sm">Sign Out</span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 relative">
        <motion.div 
          className="mb-6 sm:mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkle size={24} className="sm:hidden text-primary" weight="duotone" />
              <Sparkle size={28} className="hidden sm:block text-primary" weight="duotone" />
            </motion.div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Cognitive Training Games</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Select a game to begin training and assessing your cognitive abilities
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {GAMES.map((game, index) => {
            const Icon = getIcon(game.icon)
            return (
              <motion.div
                key={game.id}
                variants={staggerItem}
              >
                <MagneticCard
                  className="cursor-pointer h-full"
                  onClick={() => onSelectGame(game.id)}
                >
                  <Card
                    className={`h-full transition-all duration-300 border-2 border-transparent ${getCardGradient(game.category)} group overflow-hidden relative bg-card/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10`}
                  >
                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <CardHeader className="relative p-4 sm:p-5 md:p-6">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <motion.div 
                          className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10 group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300 border border-primary/10"
                          whileHover={{ rotate: 5 }}
                        >
                          <Icon size={22} className="sm:hidden text-primary" weight="duotone" />
                          <Icon size={24} className="hidden sm:block md:hidden text-primary" weight="duotone" />
                          <Icon size={26} className="hidden md:block text-primary" weight="duotone" />
                        </motion.div>
                        <Badge className={`${getCategoryColor(game.category)} shadow-lg text-xs sm:text-sm flex-shrink-0 font-medium`}>
                          {game.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors">{game.name}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">{game.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative p-4 sm:p-5 md:p-6 pt-0">
                      <Button className="w-full group/btn bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2 h-10 sm:h-11 text-sm sm:text-base font-semibold">
                        <PlayCircle size={18} className="group-hover/btn:scale-110 transition-transform" weight="fill" />
                        Start Game
                        <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                      </Button>
                    </CardContent>
                  </Card>
                </MagneticCard>
              </motion.div>
            )
          })}
        </motion.div>
      </main>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <User size={24} weight="bold" className="text-primary-foreground" />
              </div>
              My Profile
            </DialogTitle>
            <DialogDescription>
              Your account information and details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Account Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <IdentificationCard size={18} className="text-primary" />
                ACCOUNT INFORMATION
              </div>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <EnvelopeSimple size={20} className="text-primary mt-0.5 flex-shrink-0" weight="duotone" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                    <p className="font-semibold break-all">{user?.email}</p>
                  </div>
                </div>

                {user?.name && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <User size={20} className="text-primary mt-0.5 flex-shrink-0" weight="duotone" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                      <p className="font-semibold">{user.name}</p>
                    </div>
                  </div>
                )}

                {user?.rollNo && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <IdentificationCard size={20} className="text-primary mt-0.5 flex-shrink-0" weight="duotone" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Roll Number</p>
                      <p className="font-semibold">{user.rollNo}</p>
                    </div>
                  </div>
                )}

                {user?.dob && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar size={20} className="text-primary mt-0.5 flex-shrink-0" weight="duotone" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
                      <p className="font-semibold">{user.dob}</p>
                    </div>
                  </div>
                )}

                {user?.consentDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CalendarCheck size={20} className="text-primary mt-0.5 flex-shrink-0" weight="duotone" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Consent Given</p>
                      <p className="font-semibold">{user.consentDate}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CalendarCheck size={20} className="text-primary mt-0.5 flex-shrink-0" weight="duotone" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                    <p className="font-semibold">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Type Badge */}
            <div className="flex items-center justify-center pt-4 border-t">
              <Badge variant="secondary" className="px-4 py-2">
                <User size={16} weight="duotone" className="mr-2" />
                Student Account
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
