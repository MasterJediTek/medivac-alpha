/**
 * Patient Education Video Library Service
 * MediVac One v3.3
 * 
 * Provides searchable video library with condition-specific content,
 * assignment tracking, and completion monitoring.
 */

export type VideoCategory = 
  | 'cardiac'
  | 'respiratory'
  | 'diabetes'
  | 'orthopedic'
  | 'oncology'
  | 'surgical'
  | 'medication'
  | 'nutrition'
  | 'rehabilitation'
  | 'mental_health'
  | 'general_wellness';

export type VideoLanguage = 'en' | 'es' | 'zh' | 'vi' | 'ko' | 'tl' | 'ar' | 'fr';

export type VideoDifficulty = 'basic' | 'intermediate' | 'advanced';

export interface EducationVideo {
  id: string;
  title: string;
  description: string;
  category: VideoCategory;
  subcategory: string;
  duration: number; // seconds
  thumbnailUrl: string;
  videoUrl: string;
  language: VideoLanguage;
  availableLanguages: VideoLanguage[];
  difficulty: VideoDifficulty;
  icdCodes: string[]; // Related diagnosis codes
  keywords: string[];
  transcript: string;
  hasQuiz: boolean;
  quizId?: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  averageRating: number;
  isOfflineAvailable: boolean;
}

export interface VideoAssignment {
  id: string;
  patientId: string;
  patientName: string;
  videoId: string;
  videoTitle: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: Date;
  dueDate?: Date;
  priority: 'required' | 'recommended' | 'optional';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: Date;
  watchProgress: number; // percentage
  quizScore?: number;
  notes?: string;
}

export interface ViewingSession {
  id: string;
  patientId: string;
  videoId: string;
  startedAt: Date;
  endedAt?: Date;
  watchedDuration: number; // seconds
  completionPercentage: number;
  pausePoints: number[];
  replaySegments: Array<{ start: number; end: number }>;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'tv';
  isOffline: boolean;
}

export interface VideoQuiz {
  id: string;
  videoId: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  maxAttempts: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'select_all';
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  patientId: string;
  quizId: string;
  videoId: string;
  answers: Map<string, number[]>;
  score: number;
  passed: boolean;
  attemptNumber: number;
  completedAt: Date;
}

export interface VideoRecommendation {
  videoId: string;
  video: EducationVideo;
  relevanceScore: number;
  reason: string;
  basedOn: 'diagnosis' | 'history' | 'similar_patients' | 'trending';
}

export interface EducationComplianceReport {
  patientId: string;
  patientName: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  complianceRate: number;
  averageQuizScore: number;
  totalWatchTime: number;
  lastActivity?: Date;
}

class PatientEducationService {
  private videos: Map<string, EducationVideo> = new Map();
  private assignments: Map<string, VideoAssignment> = new Map();
  private sessions: Map<string, ViewingSession> = new Map();
  private quizzes: Map<string, VideoQuiz> = new Map();
  private quizAttempts: Map<string, QuizAttempt[]> = new Map();
  private offlineCache: Set<string> = new Set();

  constructor() {
    this.initializeVideoLibrary();
  }

  private initializeVideoLibrary(): void {
    // Cardiac education videos
    this.addVideo({
      id: 'vid_cardiac_001',
      title: 'Understanding Heart Failure',
      description: 'Learn about heart failure symptoms, causes, and management strategies.',
      category: 'cardiac',
      subcategory: 'heart_failure',
      duration: 720,
      thumbnailUrl: '/videos/thumbnails/heart_failure.jpg',
      videoUrl: '/videos/cardiac/heart_failure_intro.mp4',
      language: 'en',
      availableLanguages: ['en', 'es', 'zh', 'vi'],
      difficulty: 'basic',
      icdCodes: ['I50.9', 'I50.1', 'I50.2'],
      keywords: ['heart failure', 'CHF', 'cardiac', 'symptoms'],
      transcript: 'Heart failure occurs when your heart cannot pump enough blood...',
      hasQuiz: true,
      quizId: 'quiz_cardiac_001',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-06-01'),
      viewCount: 1250,
      averageRating: 4.7,
      isOfflineAvailable: true,
    });

    this.addVideo({
      id: 'vid_cardiac_002',
      title: 'Managing Your Blood Pressure',
      description: 'Tips and strategies for controlling high blood pressure at home.',
      category: 'cardiac',
      subcategory: 'hypertension',
      duration: 540,
      thumbnailUrl: '/videos/thumbnails/blood_pressure.jpg',
      videoUrl: '/videos/cardiac/blood_pressure_mgmt.mp4',
      language: 'en',
      availableLanguages: ['en', 'es', 'zh', 'ko'],
      difficulty: 'basic',
      icdCodes: ['I10', 'I11.9', 'I12.9'],
      keywords: ['blood pressure', 'hypertension', 'lifestyle'],
      transcript: 'High blood pressure, or hypertension, affects millions...',
      hasQuiz: true,
      quizId: 'quiz_cardiac_002',
      createdAt: new Date('2025-02-10'),
      updatedAt: new Date('2025-07-15'),
      viewCount: 2100,
      averageRating: 4.8,
      isOfflineAvailable: true,
    });

    // Diabetes education videos
    this.addVideo({
      id: 'vid_diabetes_001',
      title: 'Diabetes Self-Management Basics',
      description: 'Essential skills for managing type 2 diabetes effectively.',
      category: 'diabetes',
      subcategory: 'type2',
      duration: 900,
      thumbnailUrl: '/videos/thumbnails/diabetes_basics.jpg',
      videoUrl: '/videos/diabetes/self_management.mp4',
      language: 'en',
      availableLanguages: ['en', 'es', 'zh', 'vi', 'tl'],
      difficulty: 'basic',
      icdCodes: ['E11.9', 'E11.65', 'E11.8'],
      keywords: ['diabetes', 'blood sugar', 'glucose', 'self-care'],
      transcript: 'Managing diabetes requires daily attention to several factors...',
      hasQuiz: true,
      quizId: 'quiz_diabetes_001',
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-08-01'),
      viewCount: 3200,
      averageRating: 4.9,
      isOfflineAvailable: true,
    });

    this.addVideo({
      id: 'vid_diabetes_002',
      title: 'Insulin Injection Techniques',
      description: 'Proper techniques for safe and effective insulin administration.',
      category: 'diabetes',
      subcategory: 'insulin',
      duration: 600,
      thumbnailUrl: '/videos/thumbnails/insulin_injection.jpg',
      videoUrl: '/videos/diabetes/insulin_technique.mp4',
      language: 'en',
      availableLanguages: ['en', 'es', 'zh'],
      difficulty: 'intermediate',
      icdCodes: ['E11.9', 'E10.9', 'Z79.4'],
      keywords: ['insulin', 'injection', 'technique', 'diabetes'],
      transcript: 'Proper insulin injection technique is crucial for...',
      hasQuiz: true,
      quizId: 'quiz_diabetes_002',
      createdAt: new Date('2025-03-05'),
      updatedAt: new Date('2025-09-10'),
      viewCount: 1800,
      averageRating: 4.6,
      isOfflineAvailable: true,
    });

    // Surgical education videos
    this.addVideo({
      id: 'vid_surgical_001',
      title: 'Preparing for Your Surgery',
      description: 'What to expect before, during, and after your surgical procedure.',
      category: 'surgical',
      subcategory: 'pre_operative',
      duration: 480,
      thumbnailUrl: '/videos/thumbnails/surgery_prep.jpg',
      videoUrl: '/videos/surgical/pre_op_preparation.mp4',
      language: 'en',
      availableLanguages: ['en', 'es', 'zh', 'vi', 'ko', 'ar'],
      difficulty: 'basic',
      icdCodes: [],
      keywords: ['surgery', 'preparation', 'pre-op', 'anesthesia'],
      transcript: 'Preparing for surgery can feel overwhelming, but...',
      hasQuiz: true,
      quizId: 'quiz_surgical_001',
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-10-01'),
      viewCount: 4500,
      averageRating: 4.8,
      isOfflineAvailable: true,
    });

    // Initialize quizzes
    this.initializeQuizzes();
  }

  private initializeQuizzes(): void {
    this.quizzes.set('quiz_cardiac_001', {
      id: 'quiz_cardiac_001',
      videoId: 'vid_cardiac_001',
      title: 'Heart Failure Knowledge Check',
      passingScore: 70,
      maxAttempts: 3,
      questions: [
        {
          id: 'q1',
          question: 'What is the primary function affected in heart failure?',
          type: 'multiple_choice',
          options: [
            'Heart rhythm',
            'Blood pumping ability',
            'Valve function',
            'Blood vessel elasticity'
          ],
          correctAnswers: [1],
          explanation: 'Heart failure occurs when the heart cannot pump blood effectively.'
        },
        {
          id: 'q2',
          question: 'Swelling in the legs can be a symptom of heart failure.',
          type: 'true_false',
          options: ['True', 'False'],
          correctAnswers: [0],
          explanation: 'Fluid retention causing leg swelling is a common heart failure symptom.'
        },
        {
          id: 'q3',
          question: 'Which lifestyle changes help manage heart failure? (Select all that apply)',
          type: 'select_all',
          options: [
            'Reducing salt intake',
            'Regular light exercise',
            'Monitoring daily weight',
            'Smoking cessation'
          ],
          correctAnswers: [0, 1, 2, 3],
          explanation: 'All of these lifestyle changes are important for heart failure management.'
        }
      ]
    });

    this.quizzes.set('quiz_diabetes_001', {
      id: 'quiz_diabetes_001',
      videoId: 'vid_diabetes_001',
      title: 'Diabetes Self-Management Quiz',
      passingScore: 80,
      maxAttempts: 3,
      questions: [
        {
          id: 'q1',
          question: 'What is a normal fasting blood sugar range?',
          type: 'multiple_choice',
          options: [
            '50-70 mg/dL',
            '70-100 mg/dL',
            '100-150 mg/dL',
            '150-200 mg/dL'
          ],
          correctAnswers: [1],
          explanation: 'Normal fasting blood sugar is typically between 70-100 mg/dL.'
        },
        {
          id: 'q2',
          question: 'You should check your blood sugar only once a day.',
          type: 'true_false',
          options: ['True', 'False'],
          correctAnswers: [1],
          explanation: 'Many people with diabetes need to check blood sugar multiple times daily.'
        }
      ]
    });
  }

  private addVideo(video: EducationVideo): void {
    this.videos.set(video.id, video);
  }

  // Video Library Methods
  getAllVideos(): EducationVideo[] {
    return Array.from(this.videos.values());
  }

  getVideoById(videoId: string): EducationVideo | undefined {
    return this.videos.get(videoId);
  }

  searchVideos(query: string): EducationVideo[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllVideos().filter(video =>
      video.title.toLowerCase().includes(lowerQuery) ||
      video.description.toLowerCase().includes(lowerQuery) ||
      video.keywords.some(k => k.toLowerCase().includes(lowerQuery)) ||
      video.category.includes(lowerQuery)
    );
  }

  getVideosByCategory(category: VideoCategory): EducationVideo[] {
    return this.getAllVideos().filter(v => v.category === category);
  }

  getVideosByDiagnosis(icdCode: string): EducationVideo[] {
    return this.getAllVideos().filter(v => v.icdCodes.includes(icdCode));
  }

  getVideosByLanguage(language: VideoLanguage): EducationVideo[] {
    return this.getAllVideos().filter(v => 
      v.language === language || v.availableLanguages.includes(language)
    );
  }

  // Video Assignment Methods
  assignVideoToPatient(
    patientId: string,
    patientName: string,
    videoId: string,
    assignedBy: string,
    assignedByName: string,
    priority: 'required' | 'recommended' | 'optional' = 'recommended',
    dueDate?: Date,
    notes?: string
  ): VideoAssignment {
    const video = this.videos.get(videoId);
    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    const assignment: VideoAssignment = {
      id: `assign_${Date.now()}`,
      patientId,
      patientName,
      videoId,
      videoTitle: video.title,
      assignedBy,
      assignedByName,
      assignedAt: new Date(),
      dueDate,
      priority,
      status: 'pending',
      watchProgress: 0,
      notes
    };

    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  getPatientAssignments(patientId: string): VideoAssignment[] {
    return Array.from(this.assignments.values())
      .filter(a => a.patientId === patientId)
      .sort((a, b) => {
        // Sort by priority then by due date
        const priorityOrder = { required: 0, recommended: 1, optional: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return 0;
      });
  }

  updateAssignmentProgress(assignmentId: string, progress: number): void {
    const assignment = this.assignments.get(assignmentId);
    if (assignment) {
      assignment.watchProgress = progress;
      if (progress >= 90) {
        assignment.status = 'completed';
        assignment.completedAt = new Date();
      } else if (progress > 0) {
        assignment.status = 'in_progress';
      }
    }
  }

  // Viewing Session Methods
  startViewingSession(
    patientId: string,
    videoId: string,
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'tv',
    isOffline: boolean = false
  ): ViewingSession {
    const session: ViewingSession = {
      id: `session_${Date.now()}`,
      patientId,
      videoId,
      startedAt: new Date(),
      watchedDuration: 0,
      completionPercentage: 0,
      pausePoints: [],
      replaySegments: [],
      deviceType,
      isOffline
    };

    this.sessions.set(session.id, session);
    return session;
  }

  updateViewingSession(
    sessionId: string,
    watchedDuration: number,
    completionPercentage: number
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.watchedDuration = watchedDuration;
      session.completionPercentage = completionPercentage;
    }
  }

  endViewingSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endedAt = new Date();
      
      // Update video view count
      const video = this.videos.get(session.videoId);
      if (video) {
        video.viewCount++;
      }

      // Update any related assignments
      const assignments = Array.from(this.assignments.values())
        .filter(a => a.patientId === session.patientId && a.videoId === session.videoId);
      
      assignments.forEach(assignment => {
        if (session.completionPercentage > assignment.watchProgress) {
          this.updateAssignmentProgress(assignment.id, session.completionPercentage);
        }
      });
    }
  }

  getPatientViewingHistory(patientId: string): ViewingSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.patientId === patientId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  // Quiz Methods
  getQuizForVideo(videoId: string): VideoQuiz | undefined {
    return Array.from(this.quizzes.values()).find(q => q.videoId === videoId);
  }

  submitQuizAttempt(
    patientId: string,
    quizId: string,
    answers: Map<string, number[]>
  ): QuizAttempt {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      throw new Error(`Quiz ${quizId} not found`);
    }

    // Calculate score
    let correctCount = 0;
    quiz.questions.forEach(question => {
      const patientAnswers = answers.get(question.id) || [];
      const isCorrect = 
        patientAnswers.length === question.correctAnswers.length &&
        patientAnswers.every(a => question.correctAnswers.includes(a));
      if (isCorrect) correctCount++;
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Get attempt number
    const previousAttempts = this.quizAttempts.get(`${patientId}_${quizId}`) || [];
    const attemptNumber = previousAttempts.length + 1;

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      patientId,
      quizId,
      videoId: quiz.videoId,
      answers,
      score,
      passed,
      attemptNumber,
      completedAt: new Date()
    };

    // Store attempt
    if (!this.quizAttempts.has(`${patientId}_${quizId}`)) {
      this.quizAttempts.set(`${patientId}_${quizId}`, []);
    }
    this.quizAttempts.get(`${patientId}_${quizId}`)!.push(attempt);

    // Update assignment quiz score
    const assignments = Array.from(this.assignments.values())
      .filter(a => a.patientId === patientId && a.videoId === quiz.videoId);
    
    assignments.forEach(assignment => {
      if (!assignment.quizScore || score > assignment.quizScore) {
        assignment.quizScore = score;
      }
    });

    return attempt;
  }

  getPatientQuizAttempts(patientId: string, quizId: string): QuizAttempt[] {
    return this.quizAttempts.get(`${patientId}_${quizId}`) || [];
  }

  // Recommendation Engine
  getRecommendationsForPatient(
    patientId: string,
    diagnoses: string[],
    viewedVideoIds: string[]
  ): VideoRecommendation[] {
    const recommendations: VideoRecommendation[] = [];
    const allVideos = this.getAllVideos();

    // Diagnosis-based recommendations
    diagnoses.forEach(icdCode => {
      const matchingVideos = this.getVideosByDiagnosis(icdCode)
        .filter(v => !viewedVideoIds.includes(v.id));
      
      matchingVideos.forEach(video => {
        recommendations.push({
          videoId: video.id,
          video,
          relevanceScore: 0.9,
          reason: `Recommended based on your diagnosis`,
          basedOn: 'diagnosis'
        });
      });
    });

    // Trending videos
    const trendingVideos = allVideos
      .filter(v => !viewedVideoIds.includes(v.id))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);

    trendingVideos.forEach(video => {
      if (!recommendations.find(r => r.videoId === video.id)) {
        recommendations.push({
          videoId: video.id,
          video,
          relevanceScore: 0.6,
          reason: 'Popular with other patients',
          basedOn: 'trending'
        });
      }
    });

    // Sort by relevance score
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Offline Caching
  cacheVideoForOffline(videoId: string): boolean {
    const video = this.videos.get(videoId);
    if (video && video.isOfflineAvailable) {
      this.offlineCache.add(videoId);
      return true;
    }
    return false;
  }

  removeFromOfflineCache(videoId: string): void {
    this.offlineCache.delete(videoId);
  }

  getOfflineCachedVideos(): EducationVideo[] {
    return Array.from(this.offlineCache)
      .map(id => this.videos.get(id))
      .filter((v): v is EducationVideo => v !== undefined);
  }

  // Compliance Reporting
  getPatientComplianceReport(patientId: string, patientName: string): EducationComplianceReport {
    const assignments = this.getPatientAssignments(patientId);
    const sessions = this.getPatientViewingHistory(patientId);

    const completed = assignments.filter(a => a.status === 'completed').length;
    const inProgress = assignments.filter(a => a.status === 'in_progress').length;
    const overdue = assignments.filter(a => 
      a.status !== 'completed' && a.dueDate && a.dueDate < new Date()
    ).length;

    const quizScores = assignments
      .filter(a => a.quizScore !== undefined)
      .map(a => a.quizScore!);
    const averageQuizScore = quizScores.length > 0
      ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
      : 0;

    const totalWatchTime = sessions.reduce((sum, s) => sum + s.watchedDuration, 0);
    const lastActivity = sessions.length > 0 ? sessions[0].startedAt : undefined;

    return {
      patientId,
      patientName,
      totalAssigned: assignments.length,
      completed,
      inProgress,
      overdue,
      complianceRate: assignments.length > 0 
        ? Math.round((completed / assignments.length) * 100) 
        : 100,
      averageQuizScore: Math.round(averageQuizScore),
      totalWatchTime,
      lastActivity
    };
  }

  // Analytics
  getVideoAnalytics(videoId: string): {
    totalViews: number;
    uniqueViewers: number;
    averageWatchTime: number;
    completionRate: number;
    averageQuizScore: number;
  } {
    const video = this.videos.get(videoId);
    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    const videoSessions = Array.from(this.sessions.values())
      .filter(s => s.videoId === videoId);

    const uniqueViewers = new Set(videoSessions.map(s => s.patientId)).size;
    const averageWatchTime = videoSessions.length > 0
      ? videoSessions.reduce((sum, s) => sum + s.watchedDuration, 0) / videoSessions.length
      : 0;
    const completedSessions = videoSessions.filter(s => s.completionPercentage >= 90);
    const completionRate = videoSessions.length > 0
      ? (completedSessions.length / videoSessions.length) * 100
      : 0;

    // Get quiz scores
    const quiz = this.getQuizForVideo(videoId);
    let averageQuizScore = 0;
    if (quiz) {
      const allAttempts = Array.from(this.quizAttempts.values())
        .flat()
        .filter(a => a.quizId === quiz.id);
      if (allAttempts.length > 0) {
        averageQuizScore = allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length;
      }
    }

    return {
      totalViews: video.viewCount,
      uniqueViewers,
      averageWatchTime: Math.round(averageWatchTime),
      completionRate: Math.round(completionRate),
      averageQuizScore: Math.round(averageQuizScore)
    };
  }

  getCategoryStatistics(): Map<VideoCategory, { videoCount: number; totalViews: number }> {
    const stats = new Map<VideoCategory, { videoCount: number; totalViews: number }>();
    
    this.getAllVideos().forEach(video => {
      const current = stats.get(video.category) || { videoCount: 0, totalViews: 0 };
      stats.set(video.category, {
        videoCount: current.videoCount + 1,
        totalViews: current.totalViews + video.viewCount
      });
    });

    return stats;
  }
}

export const patientEducationService = new PatientEducationService();
export default patientEducationService;
