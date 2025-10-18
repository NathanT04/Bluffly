import { Component } from '@angular/core';
import { Homepage } from './homepage/homepage';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [Homepage]
})
export class AppComponent {}
