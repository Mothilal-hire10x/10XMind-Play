import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { adminAPI } from '@/lib/api-client'
import { GameResult, User } from '@/lib/types'
import { GAMES } from '@/lib/games'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SignOut, User as UserIcon, ChartBar, TrendUp, Trophy, Target, Users, FileCsv, FilePdf, DownloadSimple, Database, HardDrive, Trash, Warning, Eye, CalendarBlank, Clock, CheckCircle, XCircle } from '@phosphor-icons/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  downloadCSV, 
  downloadPDF, 
  downloadStudentSummaryCSV, 
  downloadGameSummaryCSV,
  ExportData 
} from '@/lib/export-utils'
import { downloadJSON } from '@/lib/storage-utils'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Helper to convert API response to GameResult
function apiToGameResult(apiResult: any): GameResult {
  return {
    id: apiResult.id,
    userId: apiResult.userId,
    userEmail: '', // Not returned by API
    gameId: apiResult.gameId,
    score: apiResult.score,
    reactionTime: apiResult.reactionTime,
    accuracy: apiResult.accuracy,
    errorCount: apiResult.errorCount,
    errorRate: apiResult.errorRate,
    timestamp: apiResult.completedAt,
    details: apiResult.details
  }
}

export function AdminDashboard() {
  const { logout } = useAuth()
  const [students, setStudents] = useState<User[]>([])
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('all')
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<User | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, resultsData] = await Promise.all([
          adminAPI.getUsers(),
          adminAPI.getAllResults()
        ])
        
        setStudents(usersData.filter((u: User) => u.role === 'student'))
        setGameResults(resultsData.map(apiToGameResult))
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
        toast.error('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredResults = useMemo(() => {
    let results = gameResults || []
    
    if (selectedStudent !== 'all') {
      results = results.filter(r => r.userId === selectedStudent)
    }
    
    if (selectedGame !== 'all') {
      results = results.filter(r => r.gameId === selectedGame)
    }
    
    return results
  }, [gameResults, selectedStudent, selectedGame])

  const overallStats = useMemo(() => {
    const results = filteredResults
    
    if (results.length === 0) {
      return {
        totalGames: 0,
        avgScore: 0,
        avgAccuracy: 0,
        avgReactionTime: 0,
        totalStudents: students.length
      }
    }

    const totalScore = results.reduce((sum, r) => sum + r.score, 0)
    const totalAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0)
    const reactionTimes = results.filter(r => r.reactionTime).map(r => r.reactionTime!)
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length 
      : 0

    return {
      totalGames: results.length,
      avgScore: totalScore / results.length,
      avgAccuracy: totalAccuracy / results.length,
      avgReactionTime,
      totalStudents: students.length
    }
  }, [filteredResults, students])

  const studentStats = useMemo(() => {
    return students.map(student => {
      const studentResults = (gameResults || []).filter(r => r.userId === student.id)
      
      if (studentResults.length === 0) {
        return {
          student,
          gamesPlayed: 0,
          avgScore: 0,
          avgAccuracy: 0,
          avgReactionTime: 0,
          avgErrorRate: 0,
          lastPlayed: null
        }
      }

      const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0)
      const totalAccuracy = studentResults.reduce((sum, r) => sum + r.accuracy, 0)
      const reactionTimes = studentResults.filter(r => r.reactionTime).map(r => r.reactionTime!)
      const errorRates = studentResults.filter(r => r.errorRate !== undefined).map(r => r.errorRate!)
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length 
        : 0
      const avgErrorRate = errorRates.length > 0
        ? errorRates.reduce((sum, er) => sum + er, 0) / errorRates.length
        : 0
      const lastPlayed = Math.max(...studentResults.map(r => r.timestamp))

      return {
        student,
        gamesPlayed: studentResults.length,
        avgScore: totalScore / studentResults.length,
        avgAccuracy: totalAccuracy / studentResults.length,
        avgReactionTime,
        avgErrorRate,
        lastPlayed
      }
    }).sort((a, b) => b.gamesPlayed - a.gamesPlayed)
  }, [students, gameResults])

  const gameStats = useMemo(() => {
    return GAMES.map(game => {
      const gameResults = (filteredResults || []).filter(r => r.gameId === game.id)
      
      if (gameResults.length === 0) {
        return {
          game,
          timesPlayed: 0,
          avgScore: 0,
          avgAccuracy: 0,
          avgReactionTime: 0
        }
      }

      const totalScore = gameResults.reduce((sum, r) => sum + r.score, 0)
      const totalAccuracy = gameResults.reduce((sum, r) => sum + r.accuracy, 0)
      const reactionTimes = gameResults.filter(r => r.reactionTime).map(r => r.reactionTime!)
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length 
        : 0

      return {
        game,
        timesPlayed: gameResults.length,
        avgScore: totalScore / gameResults.length,
        avgAccuracy: totalAccuracy / gameResults.length,
        avgReactionTime
      }
    }).sort((a, b) => b.timesPlayed - a.timesPlayed)
  }, [filteredResults])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewStudentDetails = (student: User) => {
    setSelectedStudentDetails(student)
    setShowDetailsDialog(true)
  }

  const getStudentGameResults = (studentId: string) => {
    return (gameResults || []).filter(r => r.userId === studentId)
  }

  const handleExport = (type: 'csv' | 'pdf' | 'student-csv' | 'game-csv') => {
    const exportData: ExportData = {
      students,
      results: gameResults || [],
      selectedStudent,
      selectedGame
    }

    try {
      switch (type) {
        case 'csv':
          downloadCSV(exportData, `progress-report-${new Date().toISOString().split('T')[0]}.csv`)
          toast.success('CSV report downloaded successfully')
          break
        case 'pdf':
          downloadPDF(exportData, `progress-report-${new Date().toISOString().split('T')[0]}.pdf`)
          toast.success('PDF report generated successfully')
          break
        case 'student-csv':
          downloadStudentSummaryCSV(exportData, `student-summary-${new Date().toISOString().split('T')[0]}.csv`)
          toast.success('Student summary CSV downloaded')
          break
        case 'game-csv':
          downloadGameSummaryCSV(exportData, `game-summary-${new Date().toISOString().split('T')[0]}.csv`)
          toast.success('Game summary CSV downloaded')
          break
      }
    } catch (error) {
      toast.error('Failed to generate report')
      console.error('Export error:', error)
    }
  }

  const handleExportAllData = async () => {
    try {
      const data = {
        users: students,
        gameResults: gameResults,
        exportDate: new Date().toISOString()
      }
      downloadJSON(data, `10xmindplay-backup-${new Date().toISOString().split('T')[0]}.json`)
      toast.success('Complete data backup downloaded')
    } catch (error) {
      toast.error('Failed to export data')
      console.error('Export data error:', error)
    }
  }

  const handleResetStorage = async () => {
    try {
      await adminAPI.resetDatabase()
      
      // Refresh data after reset
      const [usersData, resultsData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getAllResults()
      ])
      
      setStudents(usersData.filter((u: User) => u.role === 'student'))
      setGameResults(resultsData.map(apiToGameResult))
      setSelectedStudent('all')
      setSelectedGame('all')
      setShowResetDialog(false)
      
      toast.success('All database data has been cleared successfully')
    } catch (error) {
      toast.error('Failed to reset database')
      console.error('Reset database error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative z-10">
        <motion.header 
          className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <ChartBar size={24} weight="bold" className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-1">
                  <span className="text-blue-600 dark:text-blue-400">10</span>XMindPlay Admin
                </h1>
                <p className="text-xs text-muted-foreground">Analytics Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700">
                    <DownloadSimple size={16} weight="bold" />
                    Export Reports
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
                    <FileCsv size={16} className="text-green-600" />
                    <span>Detailed Report (CSV)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer">
                    <FilePdf size={16} className="text-red-600" />
                    <span>Detailed Report (PDF)</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('student-csv')} className="gap-2 cursor-pointer">
                    <FileCsv size={16} className="text-blue-600" />
                    <span>Student Summary (CSV)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('game-csv')} className="gap-2 cursor-pointer">
                    <FileCsv size={16} className="text-purple-600" />
                    <span>Game Summary (CSV)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
              <Button variant="outline" onClick={logout} className="gap-2">
                <SignOut size={16} />
                Sign Out
              </Button>
            </div>
          </div>
        </motion.header>

        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="text-3xl font-bold">Student Progress Analytics</h2>
              <p className="text-muted-foreground">Monitor and analyze cognitive training performance</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{overallStats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registered users</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy size={16} className="text-blue-600" />
                    Total Games
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{overallStats.totalGames}</div>
                  <p className="text-xs text-muted-foreground mt-1">Games completed</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target size={16} className="text-green-600" />
                    Avg Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {overallStats.avgAccuracy.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Overall accuracy</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendUp size={16} className="text-orange-600" />
                    Avg Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {overallStats.avgScore.toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Performance score</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="students" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="games">Games</TabsTrigger>
                <TabsTrigger value="overall">Overall</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Student Performance</CardTitle>
                        <CardDescription>Individual student progress and statistics</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleExport('student-csv')}
                        className="gap-2"
                      >
                        <FileCsv size={16} className="text-green-600" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentStats.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <UserIcon size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No students registered yet</p>
                        </div>
                      ) : (
                        studentStats.map((stat, index) => (
                          <motion.div
                            key={stat.student.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                                  <UserIcon size={20} weight="bold" className="text-primary-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold truncate">{stat.student.name || stat.student.email}</h3>
                                    {stat.student.rollNo && (
                                      <Badge variant="outline" className="text-xs">
                                        {stat.student.rollNo}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                    <span className="truncate">{stat.student.email}</span>
                                    {stat.student.dob && (
                                      <>
                                        <span>•</span>
                                        <span>DOB: {stat.student.dob}</span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Joined {formatDate(stat.student.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={stat.gamesPlayed > 0 ? "default" : "secondary"} className="flex-shrink-0">
                                {stat.gamesPlayed} games
                              </Badge>
                            </div>
                            
                            {stat.gamesPlayed > 0 ? (
                              <>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
                                    <p className="text-lg font-bold text-primary">{stat.avgScore.toFixed(0)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                                    <p className="text-lg font-bold text-green-600">{stat.avgAccuracy.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
                                    <p className="text-lg font-bold text-destructive">{stat.avgErrorRate.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Reaction Time</p>
                                    <p className="text-lg font-bold text-blue-600">
                                      {stat.avgReactionTime > 0 ? `${stat.avgReactionTime.toFixed(0)}ms` : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Last Played</p>
                                    <p className="text-sm font-semibold">
                                      {stat.lastPlayed ? formatDate(stat.lastPlayed) : 'Never'}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleViewStudentDetails(stat.student)}
                                  variant="outline"
                                  size="sm"
                                  className="mt-3 gap-2 w-full sm:w-auto"
                                >
                                  <Eye size={16} />
                                  View All Details
                                </Button>
                              </>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground italic">No games played yet</p>
                                <Button
                                  onClick={() => handleViewStudentDetails(stat.student)}
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Eye size={16} />
                                  View Details
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="games" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue placeholder="Filter by student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExport('game-csv')}
                    className="gap-2 sm:ml-auto"
                  >
                    <FileCsv size={16} className="text-green-600" />
                    Export CSV
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Game Performance</CardTitle>
                    <CardDescription>Statistics by cognitive training game</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {gameStats.map((stat, index) => (
                        <motion.div
                          key={stat.game.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{stat.game.name}</h3>
                                <p className="text-sm text-muted-foreground">{stat.game.description}</p>
                              </div>
                              <Badge variant="outline" className="ml-2">
                                {stat.timesPlayed} plays
                              </Badge>
                            </div>
                            
                            {stat.timesPlayed > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Avg Score</span>
                                    <span className="font-semibold">{stat.avgScore.toFixed(0)}</span>
                                  </div>
                                  <Progress value={Math.min(stat.avgScore / 10, 100)} />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Accuracy</span>
                                    <span className="font-semibold">{stat.avgAccuracy.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={stat.avgAccuracy} className="bg-green-200" />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Reaction Time</span>
                                    <span className="font-semibold">
                                      {stat.avgReactionTime > 0 ? `${stat.avgReactionTime.toFixed(0)}ms` : 'N/A'}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={stat.avgReactionTime > 0 ? Math.max(0, 100 - (stat.avgReactionTime / 20)) : 0}
                                    className="bg-blue-200"
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No plays recorded</p>
                            )}
                          </div>
                          {index < gameStats.length - 1 && <Separator className="mt-6" />}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overall" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue placeholder="Filter by student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedGame} onValueChange={setSelectedGame}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue placeholder="Filter by game" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Games</SelectItem>
                      {GAMES.map(game => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2 sm:ml-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExport('csv')}
                      className="gap-2"
                    >
                      <FileCsv size={16} className="text-green-600" />
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExport('pdf')}
                      className="gap-2"
                    >
                      <FilePdf size={16} className="text-red-600" />
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest game sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredResults.slice(-10).reverse().map((result, index) => {
                          const student = students.find(s => s.id === result.userId)
                          const game = GAMES.find(g => g.id === result.gameId)
                          const studentEmail = student?.email || result.userEmail || 'Unknown Student'
                          
                          return (
                            <motion.div
                              key={result.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{game?.name || 'Unknown Game'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {studentEmail}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(result.timestamp)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-primary">
                                  Score: {result.score.toFixed(0)}
                                </p>
                                <p className="text-xs text-green-600">
                                  {result.accuracy.toFixed(1)}% accuracy
                                </p>
                              </div>
                            </motion.div>
                          )
                        })}
                        {filteredResults.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                            <ChartBar size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No activity to display</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                      <CardDescription>Aggregated statistics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average Score</span>
                          <span className="text-2xl font-bold text-primary">
                            {overallStats.avgScore.toFixed(0)}
                          </span>
                        </div>
                        <Progress value={Math.min(overallStats.avgScore / 10, 100)} />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average Accuracy</span>
                          <span className="text-2xl font-bold text-green-600">
                            {overallStats.avgAccuracy.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={overallStats.avgAccuracy} />
                      </div>

                      {overallStats.avgReactionTime > 0 && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Avg Reaction Time</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {overallStats.avgReactionTime.toFixed(0)}ms
                            </span>
                          </div>
                          <Progress 
                            value={Math.max(0, 100 - (overallStats.avgReactionTime / 20))}
                          />
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-4 rounded-lg bg-primary/5">
                          <p className="text-sm text-muted-foreground mb-1">Total Games</p>
                          <p className="text-2xl font-bold text-primary">{overallStats.totalGames}</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-blue-600/5">
                          <p className="text-sm text-muted-foreground mb-1">Active Students</p>
                          <p className="text-2xl font-bold text-blue-600">{overallStats.totalStudents}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="storage" className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                    <Database size={16} />
                    Data Persistence Status: Active ✓
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    All student accounts and game results are stored permanently using Spark's persistent storage. 
                    Data will <strong>NOT be automatically deleted</strong> and survives page refreshes and app restarts. 
                    Only the "Reset Storage" button will clear data.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Database size={20} className="text-primary" />
                          Database Management
                        </CardTitle>
                        <CardDescription>Monitor data persistence and database health</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleExportAllData}
                          className="gap-2"
                        >
                          <DownloadSimple size={16} />
                          Backup All Data
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => setShowResetDialog(true)}
                          className="gap-2"
                        >
                          <Trash size={16} />
                          Reset Database
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Registered Students
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-primary">{students.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Total user accounts
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Game Results
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{(gameResults || []).length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Stored game sessions
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Total Game Sessions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                              {gameResults.length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Completed tests
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                          <HardDrive size={16} />
                          About Database & Data Persistence
                        </h4>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>All data is stored in SQLite database (persistent and secure)</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span><strong>Student accounts and game results persist indefinitely and survive page refreshes</strong></span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Data will NOT be automatically deleted - it remains until you explicitly use "Reset Storage"</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Use "Backup All Data" regularly to download a complete JSON backup for safety</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Storage uses Spark's cloud-based persistence tied to your app instance</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">⚠</span>
                            <span className="font-semibold">Only the "Reset Storage" button will delete student data - use with caution!</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>

      {/* Student Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <UserIcon size={24} weight="bold" className="text-primary-foreground" />
              </div>
              <div>
                <div>{selectedStudentDetails?.email}</div>
                <DialogDescription className="mt-1">
                  Complete performance overview and game history
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedStudentDetails && (
            <div className="space-y-6 mt-4">
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon size={20} className="text-primary" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-semibold">{selectedStudentDetails.email}</p>
                      </div>
                      {selectedStudentDetails.name && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="font-semibold">{selectedStudentDetails.name}</p>
                        </div>
                      )}
                      {selectedStudentDetails.rollNo && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Roll Number</p>
                          <p className="font-semibold">{selectedStudentDetails.rollNo}</p>
                        </div>
                      )}
                      {selectedStudentDetails.dob && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Date of Birth</p>
                          <p className="font-semibold">{selectedStudentDetails.dob}</p>
                        </div>
                      )}
                      {selectedStudentDetails.consentDate && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Consent Date</p>
                          <p className="font-semibold">{selectedStudentDetails.consentDate}</p>
                        </div>
                      )}
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <CalendarBlank size={24} className="text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Registration Date</p>
                          <p className="font-semibold">{formatDate(selectedStudentDetails.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Trophy size={24} className="text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total Games</p>
                          <p className="font-semibold">{getStudentGameResults(selectedStudentDetails.id).length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Clock size={24} className="text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Last Activity</p>
                          <p className="font-semibold">
                            {getStudentGameResults(selectedStudentDetails.id).length > 0
                              ? formatDate(Math.max(...getStudentGameResults(selectedStudentDetails.id).map(r => r.timestamp)))
                              : 'No activity yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Statistics */}
              {(() => {
                const studentResults = getStudentGameResults(selectedStudentDetails.id)
                if (studentResults.length === 0) {
                  return (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No games completed yet</p>
                      </CardContent>
                    </Card>
                  )
                }

                const avgScore = studentResults.reduce((sum, r) => sum + r.score, 0) / studentResults.length
                const avgAccuracy = studentResults.reduce((sum, r) => sum + r.accuracy, 0) / studentResults.length
                const reactionTimes = studentResults.filter(r => r.reactionTime).map(r => r.reactionTime!)
                const avgRT = reactionTimes.length > 0 ? reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length : 0
                const totalErrors = studentResults.reduce((sum, r) => sum + (r.errorCount || 0), 0)

                // Game-by-game breakdown
                const gameBreakdown = GAMES.map(game => {
                  const gameResults = studentResults.filter(r => r.gameId === game.id)
                  if (gameResults.length === 0) return null

                  const gameAvgScore = gameResults.reduce((sum, r) => sum + r.score, 0) / gameResults.length
                  const gameAvgAccuracy = gameResults.reduce((sum, r) => sum + r.accuracy, 0) / gameResults.length
                  const gameRT = gameResults.filter(r => r.reactionTime).map(r => r.reactionTime!)
                  const gameAvgRT = gameRT.length > 0 ? gameRT.reduce((sum, rt) => sum + rt, 0) / gameRT.length : 0

                  return {
                    game,
                    count: gameResults.length,
                    avgScore: gameAvgScore,
                    avgAccuracy: gameAvgAccuracy,
                    avgRT: gameAvgRT,
                    results: gameResults.sort((a, b) => b.timestamp - a.timestamp)
                  }
                }).filter(Boolean)

                return (
                  <>
                    {/* Overall Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Trophy size={16} className="text-primary" />
                            Avg Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-primary">{avgScore.toFixed(0)}</div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target size={16} className="text-green-600" />
                            Avg Accuracy
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">{avgAccuracy.toFixed(1)}%</div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock size={16} className="text-blue-600" />
                            Avg RT
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">
                            {avgRT > 0 ? `${avgRT.toFixed(0)}ms` : 'N/A'}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <XCircle size={16} className="text-red-600" />
                            Total Errors
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-red-600">{totalErrors}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Game-by-Game Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ChartBar size={20} className="text-primary" />
                          Performance by Game
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {gameBreakdown.map((item, idx) => {
                            if (!item) return null
                            return (
                              <div key={item.game.id} className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-lg">{item.game.name}</h4>
                                    <p className="text-sm text-muted-foreground">{item.game.description}</p>
                                  </div>
                                  <Badge variant="outline">{item.count} plays</Badge>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="p-3 rounded-lg bg-primary/5">
                                    <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
                                    <p className="text-xl font-bold text-primary">{item.avgScore.toFixed(0)}</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-green-600/5">
                                    <p className="text-xs text-muted-foreground mb-1">Avg Accuracy</p>
                                    <p className="text-xl font-bold text-green-600">{item.avgAccuracy.toFixed(1)}%</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-blue-600/5">
                                    <p className="text-xs text-muted-foreground mb-1">Avg RT</p>
                                    <p className="text-xl font-bold text-blue-600">
                                      {item.avgRT > 0 ? `${item.avgRT.toFixed(0)}ms` : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                {idx < gameBreakdown.length - 1 && <Separator className="mt-6" />}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Complete Game History Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Database size={20} className="text-primary" />
                          Complete Game History
                        </CardTitle>
                        <CardDescription>All {studentResults.length} game sessions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Game</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                                <TableHead className="text-right">Accuracy</TableHead>
                                <TableHead className="text-right">RT</TableHead>
                                <TableHead className="text-right">Errors</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentResults
                                .sort((a, b) => b.timestamp - a.timestamp)
                                .map((result) => {
                                  const game = GAMES.find(g => g.id === result.gameId)
                                  return (
                                    <TableRow key={result.id}>
                                      <TableCell className="font-medium">
                                        {formatDateTime(result.timestamp)}
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <p className="font-semibold">{game?.name || 'Unknown'}</p>
                                          <p className="text-xs text-muted-foreground">{game?.category}</p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right font-bold text-primary">
                                        {result.score.toFixed(0)}
                                      </TableCell>
                                      <TableCell className="text-right font-semibold text-green-600">
                                        {result.accuracy.toFixed(1)}%
                                      </TableCell>
                                      <TableCell className="text-right text-blue-600">
                                        {result.reactionTime ? `${result.reactionTime.toFixed(0)}ms` : 'N/A'}
                                      </TableCell>
                                      <TableCell className="text-right text-red-600">
                                        {result.errorCount || 0}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {result.accuracy >= 75 ? (
                                          <Badge className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle size={14} className="mr-1" />
                                            Good
                                          </Badge>
                                        ) : result.accuracy >= 50 ? (
                                          <Badge className="bg-yellow-600 hover:bg-yellow-700">
                                            Fair
                                          </Badge>
                                        ) : (
                                          <Badge variant="destructive">
                                            <XCircle size={14} className="mr-1" />
                                            Poor
                                          </Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Warning size={24} weight="bold" />
              Reset All Storage?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="font-semibold text-foreground">
                This action will permanently delete:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>All student accounts and login credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>All game results and performance data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>All stored records and analytics information</span>
                </li>
              </ul>
              <p className="font-semibold text-destructive pt-2">
                This cannot be undone! Consider backing up data first.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetStorage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
