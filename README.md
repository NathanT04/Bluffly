# Bluffly

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.6.

## 1. Install Dependencies
**Backend**
```
cd backend
npm install
```

**Frontend**
```
cd frontend
npm install
```

## 2. Deploy
**Run Both Servers in Seperate Terminals**
**Backend**
```
cd backend
node app.js
npm start
```

**Frontend**
```
cd frontend
ng serve --proxy-config proxy.conf.json
```

## Acknowledgements
This project integrates the [postflop-solver](https://github.com/b-inary/postflop-solver)
engine by **Wataru Inariba**, licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**.

The solver is compiled to WebAssembly and included as a dependency in the backend for running GTO calculations
All original solver rights belong to the respective author(s).