import { useState, useCallback } from 'react';
import { atsAPI, resumeAPI, interviewAPI, jobAPI, careerAPI, chatAPI } from '../services/api';

// Custom hook for API operations with loading and error states
export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeAPI = useCallback(async (apiCall, onSuccess, onError) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, executeAPI, setError };
};

// Specialized hooks for each bot
export const useATSScorer = () => {
  const { loading, error, executeAPI } = useAPI();

  const analyzeResume = useCallback((formData, onSuccess, onError) => {
    return executeAPI(
      () => atsAPI.analyzeResume(formData),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const getScore = useCallback((resumeId, onSuccess, onError) => {
    return executeAPI(
      () => atsAPI.getScore(resumeId),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  return {
    loading,
    error,
    analyzeResume,
    getScore
  };
};

export const useResumeBuilder = () => {
  const { loading, error, executeAPI } = useAPI();

  const saveResume = useCallback((resumeData, onSuccess, onError) => {
    return executeAPI(
      () => resumeAPI.createResume(resumeData),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const updateResume = useCallback((resumeId, resumeData, onSuccess, onError) => {
    return executeAPI(
      () => resumeAPI.updateResume(resumeId, resumeData),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const generatePDF = useCallback((resumeId, onSuccess, onError) => {
    return executeAPI(
      () => resumeAPI.generatePDF(resumeId),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const getResumes = useCallback((onSuccess, onError) => {
    return executeAPI(
      () => resumeAPI.getResumes(),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  return {
    loading,
    error,
    saveResume,
    updateResume,
    generatePDF,
    getResumes
  };
};

export const useInterviewCoach = () => {
  const { loading, error, executeAPI } = useAPI();

  const startSession = useCallback((sessionType, level, onSuccess, onError) => {
    return executeAPI(
      () => interviewAPI.startSession({ sessionType, level }),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const generateQuestion = useCallback((sessionId, type, level, onSuccess, onError) => {
    return executeAPI(
      () => interviewAPI.generateQuestion(sessionId, type, level),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const submitAnswer = useCallback((sessionId, questionData, onSuccess, onError) => {
    return executeAPI(
      () => interviewAPI.submitAnswer(sessionId, questionData),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const getHistory = useCallback((onSuccess, onError) => {
    return executeAPI(
      () => interviewAPI.getHistory(),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  return {
    loading,
    error,
    startSession,
    generateQuestion,
    submitAnswer,
    getHistory
  };
};

export const useJobFinder = () => {
  const { loading, error, executeAPI } = useAPI();

  const searchJobs = useCallback((criteria, onSuccess, onError) => {
    return executeAPI(
      () => jobAPI.searchExternal(criteria),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const saveJob = useCallback((jobData, onSuccess, onError) => {
    return executeAPI(
      () => jobAPI.saveJob(jobData),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const getSavedJobs = useCallback((onSuccess, onError) => {
    return executeAPI(
      () => jobAPI.getSavedJobs(),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const applyToJob = useCallback((jobId, applicationData, onSuccess, onError) => {
    return executeAPI(
      () => jobAPI.applyToJob(jobId, applicationData),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const getApplications = useCallback((onSuccess, onError) => {
    return executeAPI(
      () => jobAPI.getApplications(),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  return {
    loading,
    error,
    searchJobs,
    saveJob,
    getSavedJobs,
    applyToJob,
    getApplications
  };
};

export const useCareerAdvisor = () => {
  const { loading, error, executeAPI } = useAPI();

  const submitAssessment = useCallback((assessmentData, onSuccess, onError) => {
    return executeAPI(
      () => careerAPI.submitAssessment(assessmentData),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const getCareerSuggestions = useCallback((sessionId, onSuccess, onError) => {
    return executeAPI(
      () => careerAPI.getCareerSuggestions(sessionId),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const getSkillGapAnalysis = useCallback((currentSkills, targetRole, onSuccess, onError) => {
    return executeAPI(
      () => careerAPI.getSkillGapAnalysis(currentSkills, targetRole),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  return {
    loading,
    error,
    submitAssessment,
    getCareerSuggestions,
    getSkillGapAnalysis
  };
};

export const useChat = () => {
  const { loading, error, executeAPI } = useAPI();

  const sendMessage = useCallback((message, sessionId, onSuccess, onError) => {
    return executeAPI(
      () => chatAPI.sendMessage({ message, sessionId }),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const createSession = useCallback((type, onSuccess, onError) => {
    return executeAPI(
      () => chatAPI.createSession({ type }),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  const getSessions = useCallback((onSuccess, onError) => {
    return executeAPI(
      () => chatAPI.getSessions(),
      onSuccess,
      onError
    );
  }, [executeAPI]);

  return {
    loading,
    error,
    sendMessage,
    createSession,
    getSessions
  };
};