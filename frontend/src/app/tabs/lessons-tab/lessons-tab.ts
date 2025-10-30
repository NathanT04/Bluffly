import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type LessonDifficulty = 'easy' | 'medium' | 'hard';

type LessonQuestion = {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  answerIndex?: number;
};

type Lesson = {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  slug: LessonDifficulty;
  title: string;
  description: string;
  cta: string;
  questions: LessonQuestion[];
};

@Component({
  selector: 'app-lessons-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lessons-tab.html',
  styleUrls: ['./lessons-tab.scss']
})
export class LessonsTab {
  selectedLessonSlug: LessonDifficulty | null = null;
  readonly optionLabels = ['A', 'B', 'C', 'D'] as const;
  selectedOptions: Record<string, number | null> = {};
  submittedAnswers: Record<string, number> = {};

  readonly lessons: Lesson[] = [
    {
      difficulty: 'Easy',
      slug: 'easy',
      title: 'Poker Basics',
      description:
        'Learn the essentials—hand rankings, rules, positions, and core table etiquette to build a solid foundation.',
      cta: 'Start Easy Drills',
      questions: [
        {
          id: 'easy-1',
          prompt: 'Which poker hand ranks the highest?',
          options: [
            'Flush',
            'Straight',
            'Full House',
            'Four of a Kind'
          ],
          answerIndex: 3
        },
        {
          id: 'easy-2',
          prompt: 'You are first to act preflop. What is this position called?',
          options: [
            'Middle Position',
            'Under the Gun',
            'Cutoff',
            'Button'
          ],
          answerIndex: 1
        }
      ]
    },
    {
      difficulty: 'Medium',
      slug: 'medium',
      title: 'Smart Play Spotlights',
      description:
        'Level up with odds, table dynamics, and practical strategy to make better decisions in common scenarios.',
      cta: 'Tackle Medium Spots',
      questions: [
        {
          id: 'medium-1',
          prompt: 'You flop a strong draw with nine outs. What is your approximate chance to hit by the river?',
          options: [
            '27%',
            '35%',
            '45%',
            '54%'
          ],
          answerIndex: 3
        },
        {
          id: 'medium-2',
          prompt: 'Facing a continuation bet on a dry board from a tight player, which response is typically weakest?',
          options: [
            'Call with top pair weak kicker',
            'Raise as a bluff',
            'Fold marginal draws',
            'Fold total air'
          ],
          answerIndex: 1
        }
      ]
    },
    {
      difficulty: 'Hard',
      slug: 'hard',
      title: 'Elite Strategy',
      description:
        'Tackle advanced concepts — range construction, ICM, and GTO-inspired reasoning for high-level competitive play.',
      cta: 'Dive into Hard Mode',
      questions: [
        {
          id: 'hard-1',
          prompt: 'In a 3-bet pot, the board comes Ace-King-Seven rainbow. Which range advantage statement is most accurate?',
          options: [
            'Out-of-position caller has a nut advantage with sets',
            'In-position aggressor retains both range and nut advantage',
            'Board heavily favors suited connectors',
            'Ranges are essentially even'
          ],
          answerIndex: 1
        },
        {
          id: 'hard-2',
          prompt: 'Deep in a tournament under ICM pressure, which adjustment is most standard from the chip leader?',
          options: [
            'Tighten opening ranges drastically',
            'Increase 3-bet bluff frequency vs medium stacks',
            'Flat call more often to control pot size',
            'Limp more from early position'
          ],
          answerIndex: 1
        }
      ]
    }
  ];

  get selectedLesson(): Lesson | null {
    return this.lessons.find((lesson) => lesson.slug === this.selectedLessonSlug) ?? null;
  }

  startLesson(slug: LessonDifficulty) {
    this.resetProgress();
    this.selectedLessonSlug = slug;
  }

  exitLesson() {
    this.selectedLessonSlug = null;
    this.resetProgress();
  }

  selectOption(questionId: string, optionIndex: number) {
    if (this.submittedAnswers[questionId] !== undefined) {
      return;
    }

    this.selectedOptions[questionId] = optionIndex;
  }

  submitAnswer(questionId: string) {
    const selectedIndex = this.selectedOptions[questionId];

    if (selectedIndex === null || selectedIndex === undefined) {
      return;
    }

    this.submittedAnswers[questionId] = selectedIndex;
  }

  private resetProgress() {
    this.selectedOptions = {};
    this.submittedAnswers = {};
  }
}
