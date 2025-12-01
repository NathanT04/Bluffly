import { Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  LessonService,
  LessonDifficulty,
  LessonQuizQuestion,
  LessonQuizResult
} from '../../services/lesson.service';

type LessonSummary = {
  difficulty: LessonDifficulty;
  title: string;
  description: string;
  cta: string;
};

type PracticeSet = {
  id: string;
  title: string;
  description: string;
  difficulty: LessonDifficulty;
  vibe: string;
};

@Component({
  selector: 'app-lessons-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lessons-tab.html',
  styleUrls: ['./lessons-tab.scss']
})
export class LessonsTab implements OnInit {
  @ViewChild('quizTop') private quizTopRef?: ElementRef<HTMLDivElement>;
  private readonly lessonService = inject(LessonService);

  selectedLessonDifficulty: LessonDifficulty | null = null;
  readonly optionLabels = ['A', 'B', 'C', 'D'] as const;
  selectedOptions: Record<string, number | null> = {};
  quizQuestions: LessonQuizQuestion[] = [];
  isQuizLoading = false;
  loadError: string | null = null;
  quizSubmitted = false;
  quizSummary: { correct: number; total: number; percentage: number } | null = null;
  isSavingResult = false;
  resultSaveError: string | null = null;
  recentResults: LessonQuizResult[] = [];

  readonly lessons: LessonSummary[] = [
    {
      difficulty: 'easy',
      title: 'Poker Basics',
      description:
        'Learn the essentials—hand rankings, rules, positions, and core table etiquette to build a solid foundation.',
      cta: 'Start Easy Drills'
    },
    {
      difficulty: 'medium',
      title: 'Smart Play Spotlights',
      description:
        'Level up with odds, table dynamics, and practical strategy to make better decisions in common scenarios.',
      cta: 'Tackle Medium Spots'
    },
    {
      difficulty: 'hard',
      title: 'Elite Strategy',
      description:
        'Tackle advanced concepts — range construction, ICM, and GTO-inspired reasoning for high-level competitive play.',
      cta: 'Dive into Hard Mode'
    }
  ];

  allQuizResults: LessonQuizResult[] = [];
  isAllResultsLoading = false;
  allResultsError: string | null = null;

  readonly practiceSets: PracticeSet[] = [
    {
      id: 'warmup',
      title: 'Warm-Up Drills',
      description: 'Quick checks on fundamentals and terminology to keep the basics sharp.',
      difficulty: 'easy',
      vibe: 'Fast reps'
    },
    {
      id: 'pattern-reads',
      title: 'Pattern Reads',
      description: 'Identify betting lines, spots to float, and turn/river pivots.',
      difficulty: 'medium',
      vibe: 'Spot the play'
    },
    {
      id: 'pressure-tests',
      title: 'Pressure Tests',
      description: 'Tough, high-leverage decisions with detailed explanations.',
      difficulty: 'hard',
      vibe: 'ICM heat'
    }
  ];

  activePracticeSet: PracticeSet | null = null;
  practiceQuestions: LessonQuizQuestion[] = [];
  practiceCurrentIndex = 0;
  isPracticeLoading = false;
  practiceError: string | null = null;
  practiceIsFlipped = false;
  viewMode: 'list' | 'lesson' | 'practice' = 'list';

  get selectedLesson(): LessonSummary | null {
    return this.lessons.find((lesson) => lesson.difficulty === this.selectedLessonDifficulty) ?? null;
  }

  get activePracticeQuestion(): LessonQuizQuestion | null {
    if (!this.practiceQuestions.length) {
      return null;
    }

    return this.practiceQuestions[this.practiceCurrentIndex] ?? null;
  }

  ngOnInit(): void {
    void this.loadAllQuizResults();
  }

  startLesson(difficulty: LessonDifficulty) {
    this.selectedLessonDifficulty = difficulty;
    this.viewMode = 'lesson';
    this.resetProgress();
    void this.loadQuiz(difficulty);
    void this.loadRecentResults(difficulty);
  }

  exitLesson() {
    this.selectedLessonDifficulty = null;
    this.quizQuestions = [];
    this.loadError = null;
    this.isQuizLoading = false;
    this.quizSubmitted = false;
    this.quizSummary = null;
    this.resultSaveError = null;
    this.recentResults = [];
    this.resetProgress();
    this.viewMode = 'list';
  }

  selectOption(questionId: string, optionIndex: number) {
    if (this.quizSubmitted) {
      return;
    }

    if (!this.quizQuestions.some((question) => question.id === questionId)) {
      return;
    }

    this.selectedOptions[questionId] = optionIndex;
  }

  retryLoad() {
    if (!this.selectedLessonDifficulty) {
      return;
    }

    this.resetProgress();
    void this.loadQuiz(this.selectedLessonDifficulty);
  }

  private async loadQuiz(difficulty: LessonDifficulty) {
    this.isQuizLoading = true;
    this.loadError = null;
    this.quizQuestions = [];

    try {
      const response = await firstValueFrom(this.lessonService.getQuiz(difficulty));
      this.quizQuestions = response.questions;
    } catch (error) {
      console.error('Failed to load quiz questions', error);
      this.loadError =
        'Unable to load quiz questions right now. Please check your connection and try again.';
    } finally {
      this.isQuizLoading = false;
    }
  }

  submitQuiz() {
    if (this.quizSubmitted || this.quizQuestions.length === 0) {
      return;
    }

    const gradableQuestions = this.quizQuestions.filter(
      (question) => typeof question.correctAnswerIndex === 'number'
    );

    if (gradableQuestions.length === 0) {
      this.quizSubmitted = true;
      this.quizSummary = null;
      return;
    }

    let correct = 0;

    for (const question of gradableQuestions) {
      const selected = this.selectedOptions[question.id];
      if (
        selected !== null &&
        selected !== undefined &&
        selected === question.correctAnswerIndex
      ) {
        correct += 1;
      }
    }

    this.quizSubmitted = true;
    const percentage = Math.round((correct / gradableQuestions.length) * 100);
    this.quizSummary = { correct, total: gradableQuestions.length, percentage };
    void this.persistQuizResult();
    this.scrollToQuizTop();
  }

  isQuestionAnswered(questionId: string): boolean {
    const selection = this.selectedOptions[questionId];
    return selection !== null && selection !== undefined;
  }

  get canSubmitQuiz(): boolean {
    if (this.quizSubmitted || this.quizQuestions.length === 0) {
      return false;
    }

    return this.quizQuestions.every((question) => this.isQuestionAnswered(question.id));
  }

  isQuestionCorrect(question: LessonQuizQuestion): boolean {
    if (!this.quizSubmitted || typeof question.correctAnswerIndex !== 'number') {
      return false;
    }

    return this.selectedOptions[question.id] === question.correctAnswerIndex;
  }

  get answeredCount(): number {
    return this.quizQuestions.reduce(
      (count, question) => count + (this.isQuestionAnswered(question.id) ? 1 : 0),
      0
    );
  }

  private resetProgress() {
    this.selectedOptions = {};
    this.quizSubmitted = false;
    this.quizSummary = null;
    this.resultSaveError = null;
  }

  private scrollToQuizTop() {
    if (!this.quizTopRef) {
      return;
    }

    setTimeout(() => {
      this.quizTopRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  private async persistQuizResult() {
    if (!this.quizSummary || !this.selectedLessonDifficulty || !this.selectedLesson) {
      return;
    }

    this.isSavingResult = true;
    this.resultSaveError = null;

    try {
      await firstValueFrom(
        this.lessonService.submitQuizResult({
          difficulty: this.selectedLessonDifficulty,
          correct: this.quizSummary.correct,
          total: this.quizSummary.total,
          percentage: this.quizSummary.percentage,
          metadata: {
            questionCount: this.quizQuestions.length
          }
        })
      );
      await this.loadRecentResults(this.selectedLessonDifficulty);
      await this.loadAllQuizResults();
    } catch (error) {
      console.error('Failed to save quiz result', error);
      this.resultSaveError = 'Unable to save your quiz result right now.';
    } finally {
      this.isSavingResult = false;
    }
  }

  private async loadRecentResults(difficulty: LessonDifficulty) {
    try {
      const response = await firstValueFrom(this.lessonService.getRecentResults(difficulty, 6));
      this.recentResults = response.results;
    } catch (error) {
      console.error('Failed to load quiz history', error);
      this.recentResults = [];
    }
  }

  async loadAllQuizResults() {
    this.isAllResultsLoading = true;
    this.allResultsError = null;

    try {
      const response = await firstValueFrom(this.lessonService.getRecentResults(undefined, 9));
      this.allQuizResults = response.results;
    } catch (error) {
      console.error('Failed to load overall quiz results', error);
      this.allQuizResults = [];
      this.allResultsError = 'Unable to load quiz results right now.';
    } finally {
      this.isAllResultsLoading = false;
    }
  }

  startPracticeSet(set: PracticeSet) {
    this.activePracticeSet = set;
    this.viewMode = 'practice';
    this.practiceCurrentIndex = 0;
    this.practiceQuestions = [];
    this.practiceError = null;
    this.practiceIsFlipped = false;
    void this.loadPracticeQuestions(set);
  }

  exitPracticeSet() {
    this.activePracticeSet = null;
    this.practiceQuestions = [];
    this.practiceCurrentIndex = 0;
    this.isPracticeLoading = false;
    this.practiceError = null;
    this.practiceIsFlipped = false;
    this.viewMode = 'list';
  }

  nextPracticeQuestion() {
    if (this.practiceCurrentIndex < this.practiceQuestions.length - 1) {
      this.practiceCurrentIndex += 1;
      this.practiceIsFlipped = false;
    }
  }

  previousPracticeQuestion() {
    if (this.practiceCurrentIndex > 0) {
      this.practiceCurrentIndex -= 1;
      this.practiceIsFlipped = false;
    }
  }

  refreshPracticeSet() {
    if (!this.activePracticeSet || this.isPracticeLoading) {
      return;
    }

    this.practiceIsFlipped = false;
    this.practiceCurrentIndex = 0;
    void this.loadPracticeQuestions(this.activePracticeSet);
  }


  togglePracticeFlip() {
    this.practiceIsFlipped = !this.practiceIsFlipped;
  }

  practiceAnswerText(question: LessonQuizQuestion): string | null {
    if (typeof question.correctAnswerIndex !== 'number') {
      return null;
    }

    return question.options?.[question.correctAnswerIndex] ?? null;
  }

  private async loadPracticeQuestions(set: PracticeSet) {
    this.isPracticeLoading = true;
    this.practiceError = null;

    try {
      const response = await firstValueFrom(this.lessonService.getQuiz(set.difficulty));
      this.practiceQuestions = response.questions;
      this.practiceCurrentIndex = 0;
      this.practiceIsFlipped = false;
    } catch (error) {
      console.error('Failed to load practice set', error);
      this.practiceError =
        'Unable to load this practice set right now. Please refresh or try another set.';
    } finally {
      this.isPracticeLoading = false;
    }
  }
}
