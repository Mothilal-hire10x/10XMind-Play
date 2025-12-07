import { useAuth } from '@/lib/auth-context'
import { GAMES } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Eye, TreeStructure, Lightning, ChartLine, SignOut, Sparkle, PlayCircle, Cube, Ear, User, EnvelopeSimple, IdentificationCard, Calendar, CalendarCheck } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { Separator } from '@/components/ui/separator'

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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card backdrop-blur-sm bg-opacity-80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 md:py-4 flex items-center justify-between gap-2">
          <motion.div 
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary via-primary to-blue-600 flex items-center justify-center shadow-lg">
              <Brain size={18} className="sm:hidden text-primary-foreground" weight="bold" />
              <Brain size={20} className="hidden sm:block md:hidden text-primary-foreground" weight="bold" />
              <Brain size={24} className="hidden md:block text-primary-foreground" weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">
                <span className="text-blue-600 dark:text-blue-400">10</span>XMindPlay
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
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)} className="gap-1.5 sm:gap-2 hover:bg-primary/10 transition-all h-8 sm:h-9 px-2 sm:px-3">
              <User size={16} className="sm:hidden" weight="duotone" />
              <User size={18} className="hidden sm:block" weight="duotone" />
              <span className="hidden md:inline text-sm">Profile</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onViewResults} className="gap-1.5 sm:gap-2 hover:bg-primary/10 transition-all h-8 sm:h-9 px-2 sm:px-3">
              <ChartLine size={16} className="sm:hidden" weight="duotone" />
              <ChartLine size={18} className="hidden sm:block" weight="duotone" />
              <span className="hidden sm:inline text-sm">Results</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 sm:gap-2 hover:bg-destructive/10 hover:text-destructive transition-all h-8 sm:h-9 px-2 sm:px-3">
              <SignOut size={16} className="sm:hidden" weight="duotone" />
              <SignOut size={18} className="hidden sm:block" weight="duotone" />
              <span className="hidden md:inline text-sm">Sign Out</span>
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <motion.div 
          className="mb-4 sm:mb-6 md:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <Sparkle size={20} className="sm:hidden text-primary" weight="duotone" />
            <Sparkle size={24} className="hidden sm:block text-primary" weight="duotone" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Cognitive Training Games</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Select a game to begin training and assessing your cognitive abilities
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {GAMES.map((game, index) => {
            const Icon = getIcon(game.icon)
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`hover:shadow-xl transition-all cursor-pointer border-2 ${getCardGradient(game.category)} group overflow-hidden relative h-full`}
                  onClick={() => onSelectGame(game.id)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <motion.div 
                        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: 5 }}
                      >
                        <Icon size={20} className="sm:hidden text-primary" weight="duotone" />
                        <Icon size={22} className="hidden sm:block md:hidden text-primary" weight="duotone" />
                        <Icon size={24} className="hidden md:block text-primary" weight="duotone" />
                      </motion.div>
                      <Badge className={`${getCategoryColor(game.category)} shadow-md text-xs sm:text-sm flex-shrink-0`}>
                        {game.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg mb-1 sm:mb-2">{game.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs sm:text-sm">{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative p-4 sm:p-5 md:p-6 pt-0">
                    <Button className="w-full group/btn bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md transition-all gap-1.5 sm:gap-2 h-9 sm:h-10 text-sm sm:text-base">
                      <PlayCircle size={16} className="sm:hidden group-hover/btn:scale-110 transition-transform" weight="fill" />
                      <PlayCircle size={18} className="hidden sm:block group-hover/btn:scale-110 transition-transform" weight="fill" />
                      Start Game
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
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
