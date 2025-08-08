import { v4 as uuidv4 } from 'uuid';

// Store active quizzes and participants in memory for real-time performance
const activeQuizzes = new Map();
const activeParticipants = new Map();

export function setupSocketHandlers(socket, io, prisma, logger) {
  
  // Join quiz room
  socket.on('join-quiz', async (data) => {
    try {
      const { gameId, nickname, language } = data;
      
      logger.info(`Participant joining: ${nickname} (${language}) to quiz ${gameId}`);
      
      // Get quiz from database
      const quiz = await prisma.quiz.findUnique({
        where: { gameId },
        include: { slides: true }
      });
      
      if (!quiz) {
        socket.emit('error', { message: 'Quiz not found' });
        return;
      }
      
      if (!quiz.isActive) {
        socket.emit('error', { message: 'Quiz is not active' });
        return;
      }
      
      // Check if nickname is available
      const existingParticipant = await prisma.participant.findFirst({
        where: { quizId: quiz.id, nickname }
      });
      
      if (existingParticipant) {
        socket.emit('error', { message: 'Nickname already taken' });
        return;
      }
      
      // Create participant in database
      const participant = await prisma.participant.create({
        data: {
          quizId: quiz.id,
          nickname,
          language,
          socketId: socket.id
        }
      });
      
      // Join socket room
      socket.join(gameId);
      socket.quizId = quiz.id;
      socket.participantId = participant.id;
      
      // Store in memory for real-time access
      if (!activeQuizzes.has(gameId)) {
        activeQuizzes.set(gameId, {
          quiz,
          participants: new Map(),
          currentSlide: 0,
          isActive: true
        });
      }
      
      const quizRoom = activeQuizzes.get(gameId);
      quizRoom.participants.set(participant.id, {
        ...participant,
        socketId: socket.id
      });
      
      activeParticipants.set(socket.id, participant);
      
      // Notify host and other participants
      io.to(gameId).emit('participant-joined', {
        participant: {
          id: participant.id,
          nickname,
          language,
          joinedAt: participant.joinedAt
        },
        totalParticipants: quizRoom.participants.size
      });
      
      // Send quiz info to participant
      socket.emit('quiz-info', {
        quiz: {
          title: quiz.title,
          totalSlides: quiz.slides.length,
          currentSlide: quizRoom.currentSlide
        },
        participant: {
          id: participant.id,
          nickname,
          language
        }
      });
      
      logger.info(`Participant ${nickname} successfully joined quiz ${gameId}`);
      
    } catch (error) {
      logger.error('Error joining quiz:', error);
      socket.emit('error', { message: 'Failed to join quiz' });
    }
  });
  
  // Host controls
  socket.on('host-quiz', async (data) => {
    try {
      const { gameId, action } = data;
      
      logger.info(`Host action: ${action} for quiz ${gameId}`);
      
      const quizRoom = activeQuizzes.get(gameId);
      if (!quizRoom) {
        socket.emit('error', { message: 'Quiz not found' });
        return;
      }
      
      switch (action) {
        case 'start':
          quizRoom.isActive = true;
          await prisma.quiz.update({
            where: { gameId },
            data: { isActive: true }
          });
          io.to(gameId).emit('quiz-started');
          break;
          
        case 'next-slide':
          quizRoom.currentSlide++;
          io.to(gameId).emit('slide-changed', {
            currentSlide: quizRoom.currentSlide
          });
          break;
          
        case 'prev-slide':
          if (quizRoom.currentSlide > 0) {
            quizRoom.currentSlide--;
            io.to(gameId).emit('slide-changed', {
              currentSlide: quizRoom.currentSlide
            });
          }
          break;
          
        case 'end':
          quizRoom.isActive = false;
          await prisma.quiz.update({
            where: { gameId },
            data: { isActive: false }
          });
          io.to(gameId).emit('quiz-ended');
          break;
      }
      
    } catch (error) {
      logger.error('Error in host action:', error);
      socket.emit('error', { message: 'Host action failed' });
    }
  });
  
  // Participant answers
  socket.on('submit-answer', async (data) => {
    try {
      const { slideId, answer, responseTime } = data;
      
      if (!socket.participantId) {
        socket.emit('error', { message: 'Not joined to quiz' });
        return;
      }
      
      // Get slide info
      const slide = await prisma.slide.findUnique({
        where: { id: slideId }
      });
      
      if (!slide) {
        socket.emit('error', { message: 'Slide not found' });
        return;
      }
      
      // Check if answer is correct
      const slideContent = slide.content;
      let isCorrect = false;
      let points = 0;
      
      if (slide.type === 'multiple_choice') {
        const correctAnswer = slideContent.answers.find(a => a.correct);
        isCorrect = answer === correctAnswer.content.Text;
        points = isCorrect ? slide.points : 0;
      } else if (slide.type === 'type_answer') {
        isCorrect = slideContent.answers.includes(answer);
        points = isCorrect ? slide.points : 0;
      }
      
      // Save answer to database
      const savedAnswer = await prisma.answer.create({
        data: {
          participantId: socket.participantId,
          slideId,
          quizId: slide.quizId,
          answer,
          isCorrect,
          points,
          responseTime
        }
      });
      
      // Notify host
      socket.to(slide.quizId).emit('answer-submitted', {
        participantId: socket.participantId,
        slideId,
        isCorrect,
        responseTime
      });
      
      // Send confirmation to participant
      socket.emit('answer-confirmed', {
        answerId: savedAnswer.id,
        isCorrect,
        points
      });
      
      logger.info(`Answer submitted: ${socket.participantId} for slide ${slideId}`);
      
    } catch (error) {
      logger.error('Error submitting answer:', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });
  
  // Get participant stats
  socket.on('get-participant-stats', async () => {
    try {
      if (!socket.participantId) {
        socket.emit('error', { message: 'Not joined to quiz' });
        return;
      }
      
      const participant = await prisma.participant.findUnique({
        where: { id: socket.participantId },
        include: {
          answers: {
            include: { slide: true }
          }
        }
      });
      
      const totalPoints = participant.answers.reduce((sum, answer) => sum + answer.points, 0);
      const correctAnswers = participant.answers.filter(answer => answer.isCorrect).length;
      const totalAnswers = participant.answers.length;
      
      socket.emit('participant-stats', {
        nickname: participant.nickname,
        totalPoints,
        correctAnswers,
        totalAnswers,
        accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
      });
      
    } catch (error) {
      logger.error('Error getting participant stats:', error);
      socket.emit('error', { message: 'Failed to get stats' });
    }
  });
  
  // Get leaderboard
  socket.on('get-leaderboard', async (data) => {
    try {
      const { quizId } = data;
      
      const participants = await prisma.participant.findMany({
        where: { quizId, isActive: true },
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
          accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
        };
      }).sort((a, b) => b.totalPoints - a.totalPoints);
      
      socket.emit('leaderboard', leaderboard);
      
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      socket.emit('error', { message: 'Failed to get leaderboard' });
    }
  });
  
  // Disconnect handling
  socket.on('disconnect', async () => {
    try {
      if (socket.participantId) {
        // Update participant as inactive
        await prisma.participant.update({
          where: { id: socket.participantId },
          data: { 
            isActive: false,
            lastSeen: new Date()
          }
        });
        
        // Remove from active participants
        activeParticipants.delete(socket.id);
        
        // Notify other participants
        if (socket.quizId) {
          socket.to(socket.quizId).emit('participant-left', {
            participantId: socket.participantId
          });
        }
        
        logger.info(`Participant disconnected: ${socket.participantId}`);
      }
    } catch (error) {
      logger.error('Error handling disconnect:', error);
    }
  });
  
  // Ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });
}

// Utility functions
export function getActiveParticipants(gameId) {
  const quizRoom = activeQuizzes.get(gameId);
  return quizRoom ? Array.from(quizRoom.participants.values()) : [];
}

export function getActiveQuizzes() {
  return Array.from(activeQuizzes.keys());
}

export function cleanupInactiveQuizzes() {
  for (const [gameId, quizRoom] of activeQuizzes.entries()) {
    if (!quizRoom.isActive && quizRoom.participants.size === 0) {
      activeQuizzes.delete(gameId);
    }
  }
} 