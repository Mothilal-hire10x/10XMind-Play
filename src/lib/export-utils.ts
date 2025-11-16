import jsPDF from 'jspdf'
import { GameResult, User } from './types'
import { GAMES } from './games'

export interface ExportData {
  students: User[]
  results: GameResult[]
  selectedStudent?: string
  selectedGame?: string
}

export function generateCSV(data: ExportData): string {
  const { students, results, selectedStudent, selectedGame } = data
  
  let filteredResults = results
  if (selectedStudent && selectedStudent !== 'all') {
    filteredResults = filteredResults.filter(r => r.userId === selectedStudent)
  }
  if (selectedGame && selectedGame !== 'all') {
    filteredResults = filteredResults.filter(r => r.gameId === selectedGame)
  }

  const headers = [
    'Date',
    'Student Email',
    'Game Name',
    'Score',
    'Accuracy (%)',
    'Reaction Time (ms)',
    'Result ID'
  ]

  const rows = filteredResults.map(result => {
    const student = students.find(s => s.id === result.userId)
    const game = GAMES.find(g => g.id === result.gameId)
    const studentEmail = student?.email || result.userEmail || 'Unknown'
    
    return [
      new Date(result.timestamp).toLocaleString(),
      studentEmail,
      game?.name || 'Unknown',
      result.score.toFixed(2),
      result.accuracy.toFixed(2),
      result.reactionTime?.toFixed(0) || 'N/A',
      result.id
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

export function downloadCSV(data: ExportData, filename: string = 'student-progress-report.csv'): void {
  const csv = generateCSV(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generatePDF(data: ExportData): jsPDF {
  const { students, results, selectedStudent, selectedGame } = data
  
  let filteredResults = results
  if (selectedStudent && selectedStudent !== 'all') {
    filteredResults = filteredResults.filter(r => r.userId === selectedStudent)
  }
  if (selectedGame && selectedGame !== 'all') {
    filteredResults = filteredResults.filter(r => r.gameId === selectedGame)
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  doc.setFontSize(20)
  doc.setTextColor(72, 84, 237)
  doc.text('10XMindPlay', margin, yPos)
  
  yPos += 8
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Student Progress Report', margin, yPos)
  
  yPos += 10
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
  
  yPos += 15

  const studentFilter = selectedStudent === 'all' || !selectedStudent 
    ? 'All Students' 
    : students.find(s => s.id === selectedStudent)?.email || 'Unknown'
  const gameFilter = selectedGame === 'all' || !selectedGame
    ? 'All Games'
    : GAMES.find(g => g.id === selectedGame)?.name || 'Unknown'

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Filter - Student: ${studentFilter}`, margin, yPos)
  yPos += 6
  doc.text(`Filter - Game: ${gameFilter}`, margin, yPos)
  yPos += 15

  if (filteredResults.length === 0) {
    doc.setTextColor(150, 150, 150)
    doc.text('No data available for the selected filters.', margin, yPos)
    return doc
  }

  const totalScore = filteredResults.reduce((sum, r) => sum + r.score, 0)
  const totalAccuracy = filteredResults.reduce((sum, r) => sum + r.accuracy, 0)
  const reactionTimes = filteredResults.filter(r => r.reactionTime).map(r => r.reactionTime!)
  const avgReactionTime = reactionTimes.length > 0 
    ? reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length 
    : 0

  doc.setFillColor(240, 240, 255)
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 40, 'F')
  
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Statistics', margin + 5, yPos + 2)
  
  yPos += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Total Records: ${filteredResults.length}`, margin + 5, yPos)
  yPos += 6
  doc.text(`Average Score: ${(totalScore / filteredResults.length).toFixed(2)}`, margin + 5, yPos)
  yPos += 6
  doc.text(`Average Accuracy: ${(totalAccuracy / filteredResults.length).toFixed(2)}%`, margin + 5, yPos)
  yPos += 6
  doc.text(`Average Reaction Time: ${avgReactionTime > 0 ? avgReactionTime.toFixed(0) + 'ms' : 'N/A'}`, margin + 5, yPos)
  
  yPos += 20

  if (selectedStudent && selectedStudent !== 'all') {
    const student = students.find(s => s.id === selectedStudent)
    if (student) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Student Details', margin, yPos)
      yPos += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Email: ${student.email}`, margin + 5, yPos)
      yPos += 6
      doc.text(`Member Since: ${new Date(student.createdAt).toLocaleDateString()}`, margin + 5, yPos)
      yPos += 6
      doc.text(`Total Games Played: ${filteredResults.length}`, margin + 5, yPos)
      yPos += 15
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Detailed Results', margin, yPos)
  yPos += 10

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  const colWidths = [35, 50, 25, 25, 30]
  const headers = ['Date', 'Game', 'Score', 'Accuracy', 'RT (ms)']
  
  let xPos = margin
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos)
    xPos += colWidths[i]
  })
  
  yPos += 2
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 6

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(8)

  filteredResults.slice(0, 50).forEach((result, index) => {
    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }

    const game = GAMES.find(g => g.id === result.gameId)
    const date = new Date(result.timestamp).toLocaleDateString()
    
    xPos = margin
    const rowData = [
      date,
      game?.name || 'Unknown',
      result.score.toFixed(0),
      result.accuracy.toFixed(1) + '%',
      result.reactionTime?.toFixed(0) || 'N/A'
    ]
    
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin - 2, yPos - 4, pageWidth - 2 * margin + 4, 6, 'F')
    }
    
    rowData.forEach((cell, i) => {
      doc.text(cell, xPos, yPos)
      xPos += colWidths[i]
    })
    
    yPos += 6
  })

  if (filteredResults.length > 50) {
    yPos += 10
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(`Note: Showing first 50 of ${filteredResults.length} results`, margin, yPos)
  }

  const footerY = pageHeight - 10
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('10XMindPlay - Cognitive Training Platform', pageWidth / 2, footerY, { align: 'center' })

  return doc
}

export function downloadPDF(data: ExportData, filename: string = 'student-progress-report.pdf'): void {
  const doc = generatePDF(data)
  doc.save(filename)
}

export function generateStudentSummaryCSV(data: ExportData): string {
  const { students, results } = data
  
  const headers = [
    'Student Email',
    'Member Since',
    'Total Games Played',
    'Average Score',
    'Average Accuracy (%)',
    'Average Reaction Time (ms)',
    'Last Activity'
  ]

  const rows = students
    .filter(s => s.role === 'student')
    .map(student => {
      const studentResults = results.filter(r => r.userId === student.id)
      
      if (studentResults.length === 0) {
        return [
          student.email,
          new Date(student.createdAt).toLocaleDateString(),
          '0',
          'N/A',
          'N/A',
          'N/A',
          'Never'
        ]
      }

      const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0)
      const totalAccuracy = studentResults.reduce((sum, r) => sum + r.accuracy, 0)
      const reactionTimes = studentResults.filter(r => r.reactionTime).map(r => r.reactionTime!)
      const avgReactionTime = reactionTimes.length > 0 
        ? (reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length).toFixed(0)
        : 'N/A'
      const lastActivity = new Date(Math.max(...studentResults.map(r => r.timestamp))).toLocaleDateString()

      return [
        student.email,
        new Date(student.createdAt).toLocaleDateString(),
        studentResults.length.toString(),
        (totalScore / studentResults.length).toFixed(2),
        (totalAccuracy / studentResults.length).toFixed(2),
        avgReactionTime,
        lastActivity
      ]
    })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

export function downloadStudentSummaryCSV(data: ExportData, filename: string = 'student-summary-report.csv'): void {
  const csv = generateStudentSummaryCSV(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateGameSummaryCSV(data: ExportData): string {
  const { results, selectedStudent } = data
  
  let filteredResults = results
  if (selectedStudent && selectedStudent !== 'all') {
    filteredResults = filteredResults.filter(r => r.userId === selectedStudent)
  }

  const headers = [
    'Game Name',
    'Category',
    'Times Played',
    'Average Score',
    'Average Accuracy (%)',
    'Average Reaction Time (ms)'
  ]

  const rows = GAMES.map(game => {
    const gameResults = filteredResults.filter(r => r.gameId === game.id)
    
    if (gameResults.length === 0) {
      return [
        game.name,
        game.category,
        '0',
        'N/A',
        'N/A',
        'N/A'
      ]
    }

    const totalScore = gameResults.reduce((sum, r) => sum + r.score, 0)
    const totalAccuracy = gameResults.reduce((sum, r) => sum + r.accuracy, 0)
    const reactionTimes = gameResults.filter(r => r.reactionTime).map(r => r.reactionTime!)
    const avgReactionTime = reactionTimes.length > 0 
      ? (reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length).toFixed(0)
      : 'N/A'

    return [
      game.name,
      game.category,
      gameResults.length.toString(),
      (totalScore / gameResults.length).toFixed(2),
      (totalAccuracy / gameResults.length).toFixed(2),
      avgReactionTime
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

export function downloadGameSummaryCSV(data: ExportData, filename: string = 'game-summary-report.csv'): void {
  const csv = generateGameSummaryCSV(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
