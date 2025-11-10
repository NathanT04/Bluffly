import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysis-results.html',
  styleUrls: ['./analysis-results.scss']
})
export class AnalysisResults {
  @Input() equity: string | null = null;
  @Input() potOdds: string | null = null;
  @Input() gtoAction: string | null = null;
  @Input() message = '';
  @Input() hasSubmission = false;
}
