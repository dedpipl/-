import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
@Component({selector:'app-root',standalone:true,imports:[RouterLink,RouterOutlet],template:`
<header class="topbar"><a routerLink="/" class="brand">Учебная платформа</a><nav><a routerLink="/">Курсы</a><a routerLink="/results">Мои результаты</a><a routerLink="/teacher">Преподаватель</a></nav></header>
<main class="page"><router-outlet /></main>
<footer>Учебная платформа · Angular + TypeScript</footer>`})
export class AppComponent {}