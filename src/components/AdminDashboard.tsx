import { useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useKV } from '@github/spark/hooks'
import { GameResult, User } from '@/lib/types'
import { GAMES } from '@/lib/games'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SignOut, User as UserIcon, ChartBar, TrendUp, Trophy, Target, Users, FileCsv, FilePdf, DownloadSimple, Database, HardDrive, Trash, Warning } from '@phosphor-icons/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  downloadCSV, 
  downloadPDF, 
  downloadStudentSummaryCSV, 
  downloadGameSummaryCSV,
  ExportData 
} from '@/lib/export-utils'
import { getStorageInfo, exportAllData, downloadJSON } from '@/lib/storage-utils'
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

export function AdminDashboard() {
  const { logout } = useAuth()
  const [users, setUsers, deleteUsers] = useKV<Record<string, { password: string; user: User }>>('users', {})
  const [gameResults, setGameResults, deleteGameResults] = useKV<GameResult[]>('game-results', [])
  const [selectedStudent, setSelectedStudent] = useState<string>('all')
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [storageInfo, setStorageInfo] = useState<Record<string, any> | null>(null)
  const [loadingStorage, setLoadingStorage] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  const students = useMemo(() => {
    return Object.values(users || {})
      .map(u => u.user)
      .filter(u => u.role === 'student')
  }, [users])

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
          lastPlayed: null
        }
      }

      const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0)
      const totalAccuracy = studentResults.reduce((sum, r) => sum + r.accuracy, 0)
      const reactionTimes = studentResults.filter(r => r.reactionTime).map(r => r.reactionTime!)
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length 
        : 0
      const lastPlayed = Math.max(...studentResults.map(r => r.timestamp))

      return {
        student,
        gamesPlayed: studentResults.length,
        avgScore: totalScore / studentResults.length,
        avgAccuracy: totalAccuracy / studentResults.length,
        avgReactionTime,
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

  const handleLoadStorageInfo = async () => {
    setLoadingStorage(true)
    try {
      const info = await getStorageInfo()
      setStorageInfo(info)
      toast.success('Storage information loaded')
    } catch (error) {
      toast.error('Failed to load storage information')
      console.error('Storage info error:', error)
    } finally {
      setLoadingStorage(false)
    }
  }

  const handleExportAllData = async () => {
    try {
      const data = await exportAllData()
      downloadJSON(data, `10xmindplay-backup-${new Date().toISOString().split('T')[0]}.json`)
      toast.success('Complete data backup downloaded')
    } catch (error) {
      toast.error('Failed to export data')
      console.error('Export data error:', error)
    }
  }

  const handleResetStorage = async () => {
    try {
      deleteUsers()
      deleteGameResults()
      
      const allKeys = await window.spark.kv.keys()
      for (const key of allKeys) {
        if (key !== 'users' && key !== 'game-results') {
          await window.spark.kv.delete(key)
        }
      }
      
      setStorageInfo(null)
      setSelectedStudent('all')
      setSelectedGame('all')
      setShowResetDialog(false)
      
      toast.success('All storage data has been cleared successfully')
    } catch (error) {
      toast.error('Failed to reset storage')
      console.error('Reset storage error:', error)
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
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                                  <UserIcon size={20} weight="bold" className="text-primary-foreground" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{stat.student.email}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    Joined {formatDate(stat.student.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={stat.gamesPlayed > 0 ? "default" : "secondary"}>
                                {stat.gamesPlayed} games
                              </Badge>
                            </div>
                            
                            {stat.gamesPlayed > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
                                  <p className="text-lg font-bold text-primary">{stat.avgScore.toFixed(0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                                  <p className="text-lg font-bold text-green-600">{stat.avgAccuracy.toFixed(1)}%</p>
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
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No games played yet</p>
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
                                  {student?.email || 'Unknown Student'}
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
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Database size={20} className="text-primary" />
                          Storage Diagnostics
                        </CardTitle>
                        <CardDescription>Monitor data persistence and storage health</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleLoadStorageInfo}
                          disabled={loadingStorage}
                          className="gap-2"
                        >
                          <HardDrive size={16} />
                          {loadingStorage ? 'Loading...' : 'Check Storage'}
                        </Button>
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
                          Reset Storage
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
                              Storage Keys
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                              {storageInfo ? Object.keys(storageInfo).length : '-'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              KV store entries
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Storage Information</h3>
                        
                        {!storageInfo ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Database size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="mb-4">Click "Check Storage" to view detailed storage information</p>
                            <p className="text-xs">
                              This will show all persistent data keys and their sizes
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(storageInfo).map(([key, info]) => (
                              <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-lg border bg-card/50"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="font-mono text-sm font-semibold text-primary">
                                    {key}
                                  </div>
                                  <Badge variant="outline">
                                    {info.type}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Items</p>
                                    <p className="font-semibold">{info.itemCount}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Size</p>
                                    <p className="font-semibold">{(info.size / 1024).toFixed(2)} KB</p>
                                  </div>
                                  <div className="col-span-2 md:col-span-1">
                                    <p className="text-muted-foreground text-xs">Preview</p>
                                    <p className="font-mono text-xs truncate">{info.preview}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                          <HardDrive size={16} />
                          About Storage
                        </h4>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>All data is stored using Spark's persistent key-value store</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Student accounts and game results persist indefinitely</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Data survives page refreshes and app restarts</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Use "Backup All Data" to download a complete JSON backup</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Storage uses browser-independent persistence tied to your Spark app</span>
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
