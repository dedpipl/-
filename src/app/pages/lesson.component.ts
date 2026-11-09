import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
@Component({standalone:true,imports:[CommonModule,RouterLink],template:`
<a routerLink="/" class="back">← Все курсы</a>
<ng-container *ngIf="lesson as l"><p class="eyebrow">УРОК {{l.order}}</p><h1>{{l.title}}</h1><article class="card lesson-text"><p>{{l.content}}</p></article>
<div *ngIf="unlocked; else locked"><p class="success">Урок доступен. Прочитайте материал и пройдите тест.</p><a class="button" [routerLink]="['/test',l.testId]">Перейти к тесту</a></div>
<ng-template #locked><p class="warning">Этот урок закрыт. Сначала завершите предыдущий урок.</p></ng-template>
</ng-container>`})
export class LessonComponent {
 data=inject(DataService); route=inject(ActivatedRoute);
 id=Number(this.route.snapshot.paramMap.get('id'));
 lesson=this.data.lessons().find(l=>l.id===this.id);
 unlocked=this.lesson?this.data.isLessonUnlocked(this.lesson):false;
}