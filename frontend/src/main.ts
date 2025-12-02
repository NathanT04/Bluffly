import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { Homepage } from './app/homepage/homepage';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient(withFetch())]
});
bootstrapApplication(Homepage, {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter([
      { path: '', component: Homepage },
      { path: '**', redirectTo: '' }
    ])
  ]
}).catch(err => console.error(err));
