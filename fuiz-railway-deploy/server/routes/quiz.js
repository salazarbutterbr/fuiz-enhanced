import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  primaryLanguage: z.string().default('en'),
  availableLanguages: z.array(z.string()).min(1),
  maxParticipants: z.number().min(1).max(1000).default(500),
  slides: z.array(z.object({
    type: z.enum(['multiple_choice', 'type_answer', 'order']),
    title: z.string(),
    content: z.object({}).passthrough(),
    timeLimit: z.number().min(5).max(300).default(30),
    points: z.number().min(1).max(100).default(10),
    order: z.number(),
    translations: z.object({}).passthrough().optional()
  })).min(1)
});

// Create a new quiz
router.post('/create', async (req, res) => {
  try {
    const validatedData = createQuizSchema.parse(req.body);
    
    // Generate unique game ID
    const gameId = uuidv4().substring(0, 8).toUpperCase();
    
    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        gameId,
        primaryLanguage: validatedData.primaryLanguage,
        availableLanguages: validatedData.availableLanguages,
        maxParticipants: validatedData.maxParticipants,
        isActive: false
      }
    });
    
    // Create slides
    const slides = await Promise.all(
      validatedData.slides.map(slideData =>
        prisma.slide.create({
          data: {
            quizId: quiz.id,
            type: slideData.type,
            title: slideData.title,
            content: slideData.content,
            timeLimit: slideData.timeLimit,
            points: slideData.points,
            order: slideData.order,
            translations: slideData.translations
          }
        })
      )
    );
    
    res.json({
      success: true,
      quiz: {
        ...quiz,
        slides
      }
    });
    
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get quiz by game ID
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId },
      include: {
        slides: {
          orderBy: { order: 'asc' }
        },
        participants: {
          where: { isActive: true },
          orderBy: { joinedAt: 'desc' }
        },
        _count: {
          select: {
            participants: {
              where: { isActive: true }
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
    
    res.json({
      success: true,
      quiz
    });
    
  } catch (error) {
    console.error('Error getting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quiz'
    });
  }
});

// Start/stop quiz
router.post('/:gameId/control', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { action } = req.body;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    let updatedQuiz;
    
    switch (action) {
      case 'start':
        updatedQuiz = await prisma.quiz.update({
          where: { gameId },
          data: { isActive: true }
        });
        break;
        
      case 'stop':
        updatedQuiz = await prisma.quiz.update({
          where: { gameId },
          data: { isActive: false }
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
    
    res.json({
      success: true,
      quiz: updatedQuiz
    });
    
  } catch (error) {
    console.error('Error controlling quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to control quiz'
    });
  }
});

// Get quiz participants
router.get('/:gameId/participants', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { active = true } = req.query;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    const participants = await prisma.participant.findMany({
      where: {
        quizId: quiz.id,
        isActive: active === 'true'
      },
      include: {
        answers: {
          include: {
            slide: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });
    
    // Calculate stats for each participant
    const participantsWithStats = participants.map(participant => {
      const totalPoints = participant.answers.reduce((sum, answer) => sum + answer.points, 0);
      const correctAnswers = participant.answers.filter(answer => answer.isCorrect).length;
      const totalAnswers = participant.answers.length;
      
      return {
        ...participant,
        stats: {
          totalPoints,
          correctAnswers,
          totalAnswers,
          accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
        }
      };
    });
    
    res.json({
      success: true,
      participants: participantsWithStats
    });
    
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get participants'
    });
  }
});

// Get quiz leaderboard
router.get('/:gameId/leaderboard', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    const participants = await prisma.participant.findMany({
      where: {
        quizId: quiz.id,
        isActive: true
      },
      include: {
        answers: true
      }
    });
    
    const leaderboard = participants.map(participant => {
      const totalPoints = participant.answers.reduce((sum, answer) => sum + answer.points, 0);
      const correctAnswers = participant.answers.filter(answer => answer.isCorrect).length;
      const totalAnswers = participant.answers.length;
      
      return {
        id: participant.id,
        nickname: participant.nickname,
        language: participant.language,
        team: participant.team,
        totalPoints,
        correctAnswers,
        totalAnswers,
        accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
        joinedAt: participant.joinedAt
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
    
    res.json({
      success: true,
      leaderboard
    });
    
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
});

// Delete quiz
router.delete('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const quiz = await prisma.quiz.findUnique({
      where: { gameId }
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // Delete quiz and all related data (cascade)
    await prisma.quiz.delete({
      where: { gameId }
    });
    
    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quiz'
    });
  }
});

// Get all quizzes (for admin)
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const quizzes = await prisma.quiz.findMany({
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        _count: {
          select: {
            participants: {
              where: { isActive: true }
            },
            slides: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.quiz.count();
    
    res.json({
      success: true,
      quizzes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error getting quizzes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quizzes'
    });
  }
});

export default router; 