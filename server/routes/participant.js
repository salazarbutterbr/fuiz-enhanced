import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const joinQuizSchema = z.object({
  gameId: z.string().min(1),
  nickname: z.string().min(1).max(50),
  language: z.string().default('en'),
  team: z.string().optional()
});

const updateParticipantSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  language: z.string().optional(),
  team: z.string().optional()
});

// Join a quiz
router.post('/join', async (req, res) => {
  try {
    const validatedData = joinQuizSchema.parse(req.body);
    
    // Check if quiz exists and is active
    const quiz = await prisma.quiz.findUnique({
      where: { gameId: validatedData.gameId }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    if (!quiz.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Quiz is not active'
      });
    }
    
    // Check if participant limit reached
    const participantCount = await prisma.participant.count({
      where: { 
        quizId: quiz.id,
        isActive: true
      }
    });
    
    if (participantCount >= quiz.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Quiz is full'
      });
    }
    
    // Check if nickname is available
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        quizId: quiz.id,
        nickname: validatedData.nickname,
        isActive: true
      }
    });
    
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        error: 'Nickname already taken'
      });
    }
    
    // Create participant
    const participant = await prisma.participant.create({
      data: {
        quizId: quiz.id,
        nickname: validatedData.nickname,
        language: validatedData.language,
        team: validatedData.team
      }
    });
    
    res.json({
      success: true,
      participant: {
        id: participant.id,
        nickname: participant.nickname,
        language: participant.language,
        team: participant.team,
        joinedAt: participant.joinedAt
      },
      quiz: {
        title: quiz.title,
        gameId: quiz.gameId,
        totalParticipants: participantCount + 1
      }
    });
    
  } catch (error) {
    console.error('Error joining quiz:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Leave a quiz
router.post('/leave', async (req, res) => {
  try {
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID is required'
      });
    }
    
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { quiz: true }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }
    
    // Mark participant as inactive
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        isActive: false,
        lastSeen: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Successfully left the quiz'
    });
    
  } catch (error) {
    console.error('Error leaving quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave quiz'
    });
  }
});

// Update participant information
router.put('/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const validatedData = updateParticipantSchema.parse(req.body);
    
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }
    
    // Check if new nickname is available (if being changed)
    if (validatedData.nickname && validatedData.nickname !== participant.nickname) {
      const existingParticipant = await prisma.participant.findFirst({
        where: {
          quizId: participant.quizId,
          nickname: validatedData.nickname,
          isActive: true,
          id: { not: participantId }
        }
      });
      
      if (existingParticipant) {
        return res.status(400).json({
          success: false,
          error: 'Nickname already taken'
        });
      }
    }
    
    // Update participant
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: validatedData
    });
    
    res.json({
      success: true,
      participant: {
        id: updatedParticipant.id,
        nickname: updatedParticipant.nickname,
        language: updatedParticipant.language,
        team: updatedParticipant.team,
        joinedAt: updatedParticipant.joinedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get participant information
router.get('/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        quiz: {
          select: {
            title: true,
            gameId: true
          }
        },
        answers: {
          include: {
            slide: true
          },
          orderBy: {
            answeredAt: 'asc'
          }
        }
      }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }
    
    // Calculate statistics
    const totalPoints = participant.answers.reduce((sum, answer) => sum + answer.points, 0);
    const correctAnswers = participant.answers.filter(answer => answer.isCorrect).length;
    const totalAnswers = participant.answers.length;
    const totalResponseTime = participant.answers.reduce((sum, answer) => sum + answer.responseTime, 0);
    
    res.json({
      success: true,
      participant: {
        id: participant.id,
        nickname: participant.nickname,
        language: participant.language,
        team: participant.team,
        isActive: participant.isActive,
        joinedAt: participant.joinedAt,
        lastSeen: participant.lastSeen,
        stats: {
          totalPoints,
          correctAnswers,
          totalAnswers,
          accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
          averageResponseTime: totalAnswers > 0 ? Math.round(totalResponseTime / totalAnswers) : 0
        }
      },
      quiz: participant.quiz
    });
    
  } catch (error) {
    console.error('Error getting participant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get participant'
    });
  }
});

// Get participant answers
router.get('/:participantId/answers', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { format = 'json' } = req.query;
    
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        answers: {
          include: {
            slide: true
          },
          orderBy: {
            answeredAt: 'asc'
          }
        }
      }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }
    
    const answers = participant.answers.map(answer => ({
      slideId: answer.slideId,
      slideTitle: answer.slide.title,
      slideType: answer.slide.type,
      answer: answer.answer,
      isCorrect: answer.isCorrect,
      points: answer.points,
      responseTime: answer.responseTime,
      answeredAt: answer.answeredAt
    }));
    
    if (format === 'csv') {
      const csvData = answers.map((answer, index) => ({
        'Question Number': index + 1,
        'Question Title': answer.slideTitle,
        'Question Type': answer.slideType,
        'Answer': answer.answer,
        'Correct': answer.isCorrect ? 'Yes' : 'No',
        'Points': answer.points,
        'Response Time (ms)': answer.responseTime,
        'Answered At': answer.answeredAt.toISOString()
      }));
      
      const csv = Papa.unparse(csvData);
      const filename = `participant_${participant.nickname}_answers_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        participant: {
          id: participant.id,
          nickname: participant.nickname
        },
        answers
      });
    }
    
  } catch (error) {
    console.error('Error getting participant answers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get participant answers'
    });
  }
});

// Get participant leaderboard position
router.get('/:participantId/rank', async (req, res) => {
  try {
    const { participantId } = req.params;
    
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        quiz: {
          include: {
            participants: {
              where: { isActive: true },
              include: {
                answers: true
              }
            }
          }
        }
      }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }
    
    // Calculate scores for all participants
    const participantsWithScores = participant.quiz.participants.map(p => ({
      id: p.id,
      nickname: p.nickname,
      score: p.answers.reduce((sum, answer) => sum + answer.points, 0)
    }));
    
    // Sort by score (descending)
    participantsWithScores.sort((a, b) => b.score - a.score);
    
    // Find rank
    const rank = participantsWithScores.findIndex(p => p.id === participantId) + 1;
    const totalParticipants = participantsWithScores.length;
    const percentile = totalParticipants > 1 
      ? ((totalParticipants - rank) / totalParticipants * 100).toFixed(1)
      : '100.0';
    
    const participantScore = participantsWithScores.find(p => p.id === participantId)?.score || 0;
    
    res.json({
      success: true,
      rank,
      totalParticipants,
      percentile,
      score: participantScore,
      participant: {
        id: participant.id,
        nickname: participant.nickname
      }
    });
    
  } catch (error) {
    console.error('Error getting participant rank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get participant rank'
    });
  }
});

export default router; 