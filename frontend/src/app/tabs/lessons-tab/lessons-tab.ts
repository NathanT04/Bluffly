import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  LessonService,
  LessonDifficultySlug,
  LessonQuizQuestion
} from '../../services/lesson.service';

type LessonDifficulty = LessonDifficultySlug;

type LessonSummary = {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  slug: LessonDifficulty;
  title: string;
  description: string;
  cta: string;
};

@Component({
  selector: 'app-lessons-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lessons-tab.html',
  styleUrls: ['./lessons-tab.scss']
})
export class LessonsTab {
  @ViewChild('quizTop') private quizTopRef?: ElementRef<HTMLDivElement>;
  private readonly lessonService = inject(LessonService);

  selectedLessonSlug: LessonDifficulty | null = null;
  readonly optionLabels = ['A', 'B', 'C', 'D'] as const;
  selectedOptions: Record<string, number | null> = {};
  quizQuestions: LessonQuizQuestion[] = [];
  isQuizLoading = false;
  loadError: string | null = null;
  quizSubmitted = false;
  quizSummary: { correct: number; total: number; percentage: number } | null = null;

  readonly lessons: LessonSummary[] = [
    {
      difficulty: 'Easy',
      slug: 'easy',
      title: 'Poker Basics',
      description:
        'Learn the essentials—hand rankings, rules, positions, and core table etiquette to build a solid foundation.',
      cta: 'Start Easy Drills'
    },
    {
      difficulty: 'Medium',
      slug: 'medium',
      title: 'Smart Play Spotlights',
      description:
        'Level up with odds, table dynamics, and practical strategy to make better decisions in common scenarios.',
      cta: 'Tackle Medium Spots'
    },
    {
      difficulty: 'Hard',
      slug: 'hard',
      title: 'Elite Strategy',
      description:
        'Tackle advanced concepts — range construction, ICM, and GTO-inspired reasoning for high-level competitive play.',
      cta: 'Dive into Hard Mode'
    }
  ];

  get selectedLesson(): LessonSummary | null {
    return this.lessons.find((lesson) => lesson.slug === this.selectedLessonSlug) ?? null;
  }

  startLesson(slug: LessonDifficulty) {
    this.selectedLessonSlug = slug;
    this.resetProgress();
    void this.loadQuiz(slug);
  }

  exitLesson() {
    this.selectedLessonSlug = null;
    this.quizQuestions = [];
    this.loadError = null;
    this.isQuizLoading = false;
    this.quizSubmitted = false;
    this.quizSummary = null;
    this.resetProgress();
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
    if (!this.selectedLessonSlug) {
      return;
    }

    this.resetProgress();
    void this.loadQuiz(this.selectedLessonSlug);
  }

  private async loadQuiz(slug: LessonDifficulty) {
    this.isQuizLoading = true;
    this.loadError = null;
    this.quizQuestions = [];

    try {
      const response = await firstValueFrom(this.lessonService.getQuiz(slug));
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
  }

  private scrollToQuizTop() {
    if (!this.quizTopRef) {
      return;
    }

    setTimeout(() => {
      this.quizTopRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }
}
