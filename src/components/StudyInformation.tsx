import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Info, CheckCircle, ShieldCheck, Users, Clock, Phone } from '@phosphor-icons/react'

interface StudyInformationProps {
  onContinue: () => void
  onExit: () => void
}

export function StudyInformation({ onContinue, onExit }: StudyInformationProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl"
      >
        <Card className="shadow-2xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900">
          <CardHeader className="text-center border-b border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-500 to-indigo-600 text-white pb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="p-4 bg-white/20 rounded-full">
                <Info size={48} weight="duotone" />
              </div>
              <CardTitle className="text-4xl font-bold">Participant Information Sheet</CardTitle>
              <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-1">
                Research Study Information
              </Badge>
            </motion.div>
          </CardHeader>
          <CardContent className="p-8">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-6 rounded-xl border-l-4 border-blue-500 shadow-md"
                >
                  <div className="flex gap-3">
                    <Info size={24} weight="duotone" className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      You are invited to participate in a study. Before agreeing to take part, it is important that you read and understand the research being conducted. Please take time to read this information carefully. If at any point you wish to discontinue participation, you are free to do so without any consequences.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users size={24} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Title of the Study</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-14">
                    Relationship between Cognitive Functions, Hemispheric Dominance, and Academic Performance in Human Physiology among First-Year Medical Students: A Longitudinal Study.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <CheckCircle size={24} weight="duotone" className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Purpose of the Study</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-14">
                    This study aims to understand how different cognitive functions—such as attention, memory, executive function, visuospatial ability, and metacognition—along with hemispheric dominance, may influence academic performance in physiology among first-year medical students.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Clock size={24} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Procedure</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 ml-14 font-medium">If you agree to participate:</p>
                  <ul className="space-y-3 ml-14">
                    <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 dark:text-blue-400 font-bold">•</span>
                      <span>You will be asked to complete the following non-invasive tests: Stroop Test, Digit Span Test, Trail Making Test, Mental Rotation Test, Metacognitive Awareness Inventory (MAI), Dichotic Listening Test (DLT), and Edinburgh Handedness Inventory (EHI).</span>
                    </li>
                    <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 dark:text-blue-400 font-bold">•</span>
                      <span>These tests will be conducted in a quiet room in the Department of Physiology.</span>
                    </li>
                    <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 dark:text-blue-400 font-bold">•</span>
                      <span>The total duration will be about 60–90 minutes.</span>
                    </li>
                    <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 dark:text-blue-400 font-bold">•</span>
                      <span>After 2–3 months, your physiology theory and practical exam scores will be collected and compared with your test results.</span>
                    </li>
                  </ul>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-xl border-l-4 border-blue-500"
                  >
                    <h3 className="text-lg font-bold mb-2 text-blue-900 dark:text-blue-200">Risks and Discomforts</h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      This study involves minimal risk.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-indigo-50 dark:bg-indigo-950/30 p-5 rounded-xl border-l-4 border-indigo-500"
                  >
                    <h3 className="text-lg font-bold mb-2 text-indigo-900 dark:text-indigo-200">Benefits</h3>
                    <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                      You may gain awareness of your own cognitive strengths and learning strategies. The results of this study may help in developing better academic support programs for medical students.
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-xl border-l-4 border-blue-500"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <ShieldCheck size={24} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200">Confidentiality</h3>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 ml-9">
                    Your identity will remain strictly confidential. All data will be coded and used only for research purposes. Results will be reported in group form without identifying any individual participant.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-xl border-l-4 border-indigo-500"
                >
                  <h3 className="text-xl font-bold mb-2 text-indigo-900 dark:text-indigo-200">Voluntary Participation</h3>
                  <p className="text-indigo-700 dark:text-indigo-300">
                    Participation is entirely voluntary. You are free to refuse or withdraw from the study at any stage, without providing a reason. Your decision will not affect your academic standing in any way.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-md"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Phone size={24} weight="duotone" className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-200">Contact Information</h3>
                  </div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3 ml-14">
                    If you have any questions or concerns about this study, please contact:
                  </p>
                  <div className="ml-14 space-y-1">
                    <p className="font-semibold text-indigo-900 dark:text-indigo-100">Principal Investigator</p>
                    <p className="text-indigo-700 dark:text-indigo-300">Dr. T. Sowjanya</p>
                    <p className="text-indigo-600 dark:text-indigo-400">Associate Professor</p>
                    <p className="text-indigo-600 dark:text-indigo-400">Department of Physiology</p>
                    <p className="text-indigo-600 dark:text-indigo-400">Neelima Institute of Medical Sciences, Hyderabad</p>
                  </div>
                </motion.div>
              </div>
            </ScrollArea>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="flex gap-4 justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <Button
                onClick={onExit}
                variant="outline"
                size="lg"
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                Exit
              </Button>
              <Button
                onClick={onContinue}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                I Understand - Continue →
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
