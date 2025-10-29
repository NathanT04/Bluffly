import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-lessons-tab',
  standalone: true,
  imports: [NgFor],
  templateUrl: './lessons-tab.html',
  styleUrls: ['./lessons-tab.scss']
})
export class LessonsTab {
  readonly lessons = [
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
  ] as const;
}
