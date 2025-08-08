import express from 'express';
import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';

const router = express.Router();
const prisma = new PrismaClient();

// Export participant data
router.get('/:gameId/participants', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { format = 'csv' } = req.query;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId },
      include: {
        slides: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    const participants = await prisma.participant.findMany({
      where: { quizId: quiz.id },
      include: {
        answers: {
          include: {
            slide: true
          },
          orderBy: {
            answeredAt: 'asc'
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });
    
    // Prepare CSV data
    const csvData = participants.map(participant => {
      const totalPoints = participant.answers.reduce((sum, answer) => sum + answer.points, 0);
      const correctAnswers = participant.answers.filter(answer => answer.isCorrect).length;
      const totalAnswers = participant.answers.length;
      const totalResponseTime = participant.answers.reduce((sum, answer) => sum + answer.responseTime, 0);
      
      const row = {
        'Nickname': participant.nickname,
        'Language': participant.language,
        'Team': participant.team || '',
        'Total Score': totalPoints,
        'Correct Answers': correctAnswers,
        'Total Questions': totalAnswers,
        'Accuracy (%)': totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : '0.00',
        'Total Response Time (ms)': totalResponseTime,
        'Average Response Time (ms)': totalAnswers > 0 ? Math.round(totalResponseTime / totalAnswers) : 0,
        'Joined At': participant.joinedAt.toISOString(),
        'Last Seen': participant.lastSeen.toISOString(),
        'Is Active': participant.isActive ? 'Yes' : 'No'
      };
      
      // Add individual question data
      quiz.slides.forEach((slide, index) => {
        const answer = participant.answers.find(a => a.slideId === slide.id);
        if (answer) {
          row[`Q${index + 1} Answer`] = answer.answer;
          row[`Q${index + 1} Correct`] = answer.isCorrect ? 'Yes' : 'No';
          row[`Q${index + 1} Points`] = answer.points;
          row[`Q${index + 1} Response Time (ms)`] = answer.responseTime;
        } else {
          row[`Q${index + 1} Answer`] = '';
          row[`Q${index + 1} Correct`] = '';
          row[`Q${index + 1} Points`] = '';
          row[`Q${index + 1} Response Time (ms)`] = '';
        }
      });
      
      return row;
    });
    
    if (format === 'json') {
      return res.json({
        success: true,
        data: csvData,
        quiz: {
          title: quiz.title,
          gameId: quiz.gameId,
          totalParticipants: participants.length,
          totalSlides: quiz.slides.length
        }
      });
    }
    
    // Generate CSV
    const csv = Papa.unparse(csvData);
    const filename = `fuiz_${quiz.title.replace(/[^a-z0-9]/gi, '_')}_participants_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Error exporting participant data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export participant data'
    });
  }
});

// Export summary statistics
router.get('/:gameId/summary', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { format = 'csv' } = req.query;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId },
      include: {
        slides: {
          orderBy: { order: 'asc' }
        },
        participants: {
          include: {
            answers: true
          }
        }
      }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    const participants = quiz.participants;
    const totalParticipants = participants.length;
    const activeParticipants = participants.filter(p => p.isActive).length;
    
    // Calculate statistics
    const scores = participants.map(p => 
      p.answers.reduce((sum, answer) => sum + answer.points, 0)
    );
    
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const highestScore = Math.max(...scores, 0);
    const lowestScore = Math.min(...scores, 0);
    
    // Language distribution
    const languageDistribution = {};
    participants.forEach(p => {
      languageDistribution[p.language] = (languageDistribution[p.language] || 0) + 1;
    });
    
    // Question statistics
    const questionStats = quiz.slides.map((slide, index) => {
      const slideAnswers = participants.flatMap(p => 
        p.answers.filter(a => a.slideId === slide.id)
      );
      
      const correctAnswers = slideAnswers.filter(a => a.isCorrect).length;
      const totalAnswers = slideAnswers.length;
      const averageResponseTime = slideAnswers.length > 0 
        ? slideAnswers.reduce((sum, a) => sum + a.responseTime, 0) / slideAnswers.length 
        : 0;
      
      return {
        questionNumber: index + 1,
        questionTitle: slide.title,
        totalAnswers,
        correctAnswers,
        accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
        averageResponseTime: Math.round(averageResponseTime)
      };
    });
    
    const summaryData = [
      { Metric: 'Quiz Title', Value: quiz.title },
      { Metric: 'Game ID', Value: quiz.gameId },
      { Metric: 'Total Participants', Value: totalParticipants },
      { Metric: 'Active Participants', Value: activeParticipants },
      { Metric: 'Total Questions', Value: quiz.slides.length },
      { Metric: 'Average Score', Value: averageScore.toFixed(2) },
      { Metric: 'Highest Score', Value: highestScore },
      { Metric: 'Lowest Score', Value: lowestScore },
      { Metric: 'Export Date', Value: new Date().toISOString() },
      { Metric: '', Value: '' },
      { Metric: 'Language Distribution', Value: '' }
    ];
    
    // Add language distribution
    Object.entries(languageDistribution).forEach(([language, count]) => {
      summaryData.push({
        Metric: `${language} participants`,
        Value: count
      });
    });
    
    summaryData.push({ Metric: '', Value: '' });
    summaryData.push({ Metric: 'Question Statistics', Value: '' });
    
    // Add question statistics
    questionStats.forEach(stat => {
      summaryData.push({
        Metric: `Q${stat.questionNumber} - ${stat.questionTitle}`,
        Value: `${stat.correctAnswers}/${stat.totalAnswers} correct (${stat.accuracy.toFixed(1)}%)`
      });
    });
    
    if (format === 'json') {
      return res.json({
        success: true,
        data: {
          quiz: {
            title: quiz.title,
            gameId: quiz.gameId,
            totalParticipants,
            activeParticipants,
            totalQuestions: quiz.slides.length
          },
          statistics: {
            averageScore,
            highestScore,
            lowestScore,
            languageDistribution,
            questionStats
          }
        }
      });
    }
    
    // Generate CSV
    const csv = Papa.unparse(summaryData);
    const filename = `fuiz_${quiz.title.replace(/[^a-z0-9]/gi, '_')}_summary_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Error exporting summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export summary'
    });
  }
});

// Export detailed analysis
router.get('/:gameId/analysis', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { format = 'csv' } = req.query;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId },
      include: {
        participants: {
          include: {
            answers: {
              include: {
                slide: true
              }
            }
          }
        }
      }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    const participants = quiz.participants;
    
    // Calculate detailed statistics for each participant
    const analysisData = participants.map((participant, index) => {
      const totalPoints = participant.answers.reduce((sum, answer) => sum + answer.points, 0);
      const correctAnswers = participant.answers.filter(answer => answer.isCorrect).length;
      const totalAnswers = participant.answers.length;
      const totalResponseTime = participant.answers.reduce((sum, answer) => sum + answer.responseTime, 0);
      const averageResponseTime = totalAnswers > 0 ? totalResponseTime / totalAnswers : 0;
      
      // Calculate response time statistics
      const responseTimes = participant.answers.map(a => a.responseTime);
      const fastestResponse = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
      const slowestResponse = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
      
      // Calculate rank and percentile
      const sortedParticipants = [...participants].sort((a, b) => {
        const aScore = a.answers.reduce((sum, answer) => sum + answer.points, 0);
        const bScore = b.answers.reduce((sum, answer) => sum + answer.points, 0);
        return bScore - aScore;
      });
      
      const rank = sortedParticipants.findIndex(p => p.id === participant.id) + 1;
      const percentile = participants.length > 1 
        ? ((participants.length - rank) / participants.length * 100).toFixed(1)
        : '100.0';
      
      return {
        'Rank': rank,
        'Nickname': participant.nickname,
        'Language': participant.language,
        'Team': participant.team || '',
        'Total Score': totalPoints,
        'Percentile': percentile,
        'Correct Answers': correctAnswers,
        'Total Questions': totalAnswers,
        'Accuracy (%)': totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : '0.00',
        'Total Response Time (ms)': totalResponseTime,
        'Average Response Time (ms)': Math.round(averageResponseTime),
        'Fastest Response (ms)': fastestResponse,
        'Slowest Response (ms)': slowestResponse,
        'Joined At': participant.joinedAt.toISOString(),
        'Last Seen': participant.lastSeen.toISOString(),
        'Is Active': participant.isActive ? 'Yes' : 'No'
      };
    });
    
    // Sort by rank
    analysisData.sort((a, b) => a.Rank - b.Rank);
    
    if (format === 'json') {
      return res.json({
        success: true,
        data: analysisData,
        quiz: {
          title: quiz.title,
          gameId: quiz.gameId,
          totalParticipants: participants.length
        }
      });
    }
    
    // Generate CSV
    const csv = Papa.unparse(analysisData);
    const filename = `fuiz_${quiz.title.replace(/[^a-z0-9]/gi, '_')}_analysis_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Error exporting analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analysis'
    });
  }
});

// Export all data (comprehensive)
router.get('/:gameId/all', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId },
      include: {
        slides: {
          orderBy: { order: 'asc' }
        },
        participants: {
          include: {
            answers: {
              include: {
                slide: true
              }
            }
          }
        }
      }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // Create comprehensive export data
    const exportData = {
      quiz: {
        title: quiz.title,
        gameId: quiz.gameId,
        primaryLanguage: quiz.primaryLanguage,
        availableLanguages: quiz.availableLanguages,
        totalParticipants: quiz.participants.length,
        totalSlides: quiz.slides.length,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt
      },
      slides: quiz.slides.map(slide => ({
        id: slide.id,
        type: slide.type,
        title: slide.title,
        content: slide.content,
        timeLimit: slide.timeLimit,
        points: slide.points,
        order: slide.order,
        translations: slide.translations
      })),
      participants: quiz.participants.map(participant => ({
        id: participant.id,
        nickname: participant.nickname,
        language: participant.language,
        team: participant.team,
        isActive: participant.isActive,
        joinedAt: participant.joinedAt,
        lastSeen: participant.lastSeen,
        answers: participant.answers.map(answer => ({
          slideId: answer.slideId,
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          points: answer.points,
          responseTime: answer.responseTime,
          answeredAt: answer.answeredAt
        }))
      })),
      exportDate: new Date().toISOString()
    };
    
    const filename = `fuiz_${quiz.title.replace(/[^a-z0-9]/gi, '_')}_complete_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);
    
  } catch (error) {
    console.error('Error exporting all data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export all data'
    });
  }
});

export default router; 