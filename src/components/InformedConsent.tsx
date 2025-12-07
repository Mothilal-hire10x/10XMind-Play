import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { FileText, PenNib, Calendar, CheckCircle, X } from '@phosphor-icons/react'

interface InformedConsentProps {
  userName: string
  onConsent: (consentData: { name: string; date: string }) => void
  onDecline: () => void
}

export function InformedConsent({ userName, onConsent, onDecline }: InformedConsentProps) {
  const [participantName, setParticipantName] = useState(userName || '')
  const [consentDate, setConsentDate] = useState(new Date().toISOString().split('T')[0])
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!participantName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!agreed) {
      setError('Please confirm that you have read and agree to participate')
      return
    }

    onConsent({
      name: participantName,
      date: consentDate
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl"
      >
        <Card className="shadow-2xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900">
          <CardHeader className="text-center border-b border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="p-4 bg-white/20 rounded-full">
                <FileText size={48} weight="duotone" />
              </div>
              <CardTitle className="text-4xl font-bold">Informed Consent Form</CardTitle>
              <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-1">
                Voluntary Agreement to Participate
              </Badge>
            </motion.div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit}>
              <ScrollArea className="h-[450px] pr-4 mb-6">
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-6 rounded-xl border-l-4 border-blue-500 shadow-md"
                  >
                    <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                      I, the undersigned, Mr. / Ms. <strong className="text-blue-600 dark:text-blue-400 underline decoration-2">{participantName || '________________'}</strong>, applying my free power of choice, hereby give my consent to participate in the research study titled:
                    </p>
                    <p className="font-bold mt-4 text-center text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                      "Relationship between Cognitive Functions, Hemispheric Dominance, and Academic Performance in Human Physiology among First-Year Medical Students: A Longitudinal Study."
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      I have been explained the purpose, procedures, possible risks, and benefits of this study to my satisfaction. I have also had the opportunity to ask questions and clarify any doubts regarding the study.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm"
                  >
                    <p className="font-bold mb-4 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <CheckCircle size={20} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                      I understand that:
                    </p>
                    <ul className="space-y-4">
                      <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">✓</span>
                        <span>My participation in this study is entirely voluntary.</span>
                      </li>
                      <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">✓</span>
                        <span>
                          I am free to withdraw from the study at any point without giving a reason, and this will not affect my academic standing or rights in any way.
                        </span>
                      </li>
                      <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">✓</span>
                        <span>
                          My identity will remain confidential, and no personal information will be disclosed in any reports or publications arising from the study.
                        </span>
                      </li>
                      <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">✓</span>
                        <span>
                          The data collected from me may be used for scientific purposes, provided confidentiality is maintained.
                        </span>
                      </li>
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-4"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
                      By signing below, I confirm that I have read (or have had read to me) the information provided, and I voluntarily agree to participate in this study.
                    </p>
                  </motion.div>
                </div>
              </ScrollArea>

              <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="participantName" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <PenNib size={18} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                      Participant Name *
                    </Label>
                    <Input
                      id="participantName"
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="Enter your full name"
                      className="text-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="consentDate" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Calendar size={18} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                      Date
                    </Label>
                    <Input
                      id="consentDate"
                      type="date"
                      value={consentDate}
                      onChange={(e) => setConsentDate(e.target.value)}
                      className="text-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500"
                      required
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-start gap-3 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-md"
                >
                  <Checkbox
                    id="consent"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    className="mt-1 border-blue-600 dark:border-blue-500"
                  />
                  <label
                    htmlFor="consent"
                    className="text-sm font-medium leading-relaxed cursor-pointer text-gray-800 dark:text-gray-200"
                  >
                    I confirm that I have read and understood the participant information sheet and this consent form. I voluntarily agree to participate in this research study.
                  </label>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Alert variant="destructive" className="border-red-300 dark:border-red-700">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex gap-4 justify-between pt-4"
                >
                  <Button
                    type="button"
                    onClick={onDecline}
                    variant="outline"
                    size="lg"
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-2"
                  >
                    <X size={20} weight="bold" />
                    Decline & Exit
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!agreed}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 flex items-center gap-2"
                  >
                    <CheckCircle size={20} weight="bold" />
                    I Consent - Proceed
                  </Button>
                </motion.div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
