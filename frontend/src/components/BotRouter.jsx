// frontend/src/components/BotRouter.jsx

import React, { useState, useContext, createContext } from 'react'
import { Box, Paper, Button } from '@mui/material'
import {
  Analytics,
  Edit,
  Psychology,
  Search,
  Lightbulb,
  Code,
  Videocam
} from '@mui/icons-material'

import ATSScorer from './Bots/ATSScorer'
import ResumeBuilder from './Bots/ResumeBuilder_AI'
import InterviewCoach from './Bots/InterviewCoach'
import JobFinder from './Bots/JobFinder'
import CareerAdvisor from './Bots/CareerAdvisor'
import CodingPracticeBot from './Bots/CodingPracticeBot'
import AptitudeAssessmentBot from './Bots/AptitudeAssessmentBot'
import LiveInterviewBot from './Bots/LiveInterviewBot'
import ChatInterface from './Chat/ChatInterface'

const BotContext = createContext()

export const useBotContext = () => {
  const context = useContext(BotContext)
  if (!context) throw new Error('useBotContext must be used within a BotProvider')
  return context
}

const BotRouter = () => {
  const [activeBot, setActiveBot] = useState('main')

  const switchBot = (botKey) => setActiveBot(botKey)
  const goToMain = () => setActiveBot('main')

  const contextValue = { activeBot, switchBot, goToMain }

  const modules = [
    { key: 'ats-scorer', label: 'ATS Scorer', icon: <Analytics fontSize="small" /> },
    { key: 'resume-builder', label: 'Resume Builder', icon: <Edit fontSize="small" /> },
    { key: 'interview-coach', label: 'Interview Coach', icon: <Psychology fontSize="small" /> },
    { key: 'live-interview', label: 'Live Interview', icon: <Videocam fontSize="small" /> },
    { key: 'coding-practice', label: 'Coding Practice', icon: <Code fontSize="small" /> },
    { key: 'aptitude-assessment', label: 'Aptitude Test', icon: <Psychology fontSize="small" /> },
    { key: 'job-finder', label: 'Job Finder', icon: <Search fontSize="small" /> },
    { key: 'career-advisor', label: 'Career Advisor', icon: <Lightbulb fontSize="small" /> }
  ]

  return (
    <BotContext.Provider value={contextValue}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Paper
          elevation={0}
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            flexWrap: 'nowrap',
            overflowX: 'auto'
          }}
        >
          {modules.map((m) => (
            <Button
              key={m.key}
              size="small"
              startIcon={m.icon}
              variant={activeBot === m.key ? 'contained' : 'outlined'}
              onClick={() => switchBot(m.key)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {m.label}
            </Button>
          ))}
        </Paper>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          {activeBot === 'main' && <ChatInterface />}
          {activeBot === 'ats-scorer' && <ATSScorer />}
          {activeBot === 'resume-builder' && <ResumeBuilder />}
          {activeBot === 'interview-coach' && <InterviewCoach />}
          {activeBot === 'live-interview' && <LiveInterviewBot />}
          {activeBot === 'coding-practice' && <CodingPracticeBot />}
          {activeBot === 'aptitude-assessment' && <AptitudeAssessmentBot />}
          {activeBot === 'job-finder' && <JobFinder />}
          {activeBot === 'career-advisor' && <CareerAdvisor />}
        </Box>
      </Box>
    </BotContext.Provider>
  )
}

export default BotRouter
