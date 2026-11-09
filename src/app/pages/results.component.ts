import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
@Component({standalone:true,imports:[CommonModule],template:`
<p class="eyebrow">ОБУЧЕНИЕ</p><h1>Мои результаты</h1>
<div class="stats"><div class="card"><span>Завершено попыток</span><strong>{{myResults.length}}</strong></div><div class="card"><span>Средний результат</span><strong>{{average}}%</strong></div></div>
<div class="card" *ngFor="let r of myResults"><div class="result-row"><div><h2>{{lessonTitle(r.testId)}}</h2><p class="muted">{{r.completedAt | date:'dd.MM.yyyy HH:mm'}}</p></div><strong>{{r.score}} / {{r.maxScore}}</strong></div></div>
<p class="muted" *ngIf="!myResults.length">Вы ещё не завершили ни одной попытки.</p>`})
export class ResultsComponent {
 data=inject(DataService);
 myResults=this.data.results().filter(r=>r.userId===1).sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
 average=this.myResults.length?Math.round(this.myResults.reduce((s,r)=>s+r.score/Math.max(r.maxScore,1)*100,0)/this.myResults.length):0;
 lessonTitle(testId:number):string{return this.data.lessons().find(l=>l.testId===testId)?.title??'Тест';}
}