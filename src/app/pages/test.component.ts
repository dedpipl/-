import { Component, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
import { Question, Attempt } from '../models';
@Component({standalone:true,imports:[CommonModule,RouterLink],template:`
<a routerLink="/" class="back">← К курсам</a>
<ng-container *ngIf="attempt as a">
<div class="test-head"><div><p class="eyebrow">ТЕСТИРОВАНИЕ</p><h1>{{testTitle}}</h1></div><div class="timer" [class.danger]="remaining()<=60">{{timeText()}}</div></div>
<p class="muted">Порядок вопросов закреплён за попыткой. Ответы сохраняются автоматически.</p>
<article class="card question" *ngFor="let q of questions; let i=index">
<p class="eyebrow">ВОПРОС {{i+1}} · {{q.score}} БАЛЛА</p><h2>{{q.text}}</h2>
<p class="muted">{{q.correctOptions.length>1?'Можно выбрать несколько вариантов':'Выберите один вариант'}}</p>
<label class="option" *ngFor="let option of q.options"><input [type]="q.correctOptions.length>1?'checkbox':'radio'" [name]="'q'+q.id" [checked]="isSelected(q.id,option)" (change)="toggle(q.id,option,$event)"> {{option}}</label>
</article>
<button class="button" (click)="finish()">Завершить попытку</button>
</ng-container>`})
export class TestComponent implements OnDestroy {
 data=inject(DataService); route=inject(ActivatedRoute); router=inject(Router);
 testId=Number(this.route.snapshot.paramMap.get('id'));
 attempt:Attempt|undefined;
 questions:Question[]=[];
 testTitle='Проверка знаний';
 remaining=signal(0);
 private interval?:ReturnType<typeof setInterval>;
 constructor(){
  this.attempt=this.data.startOrResume(this.testId);
  this.questions=this.data.getTestQuestions(this.testId,this.attempt.seed);
  this.testTitle=this.data.lessons().find(l=>l.testId===this.testId)?.title ?? this.testTitle;
  this.tick();
  this.interval=setInterval(()=>this.tick(),1000);
 }
 tick():void {
  if(!this.attempt)return;
  const left=Math.max(0,Math.floor((new Date(this.attempt.expiresAt).getTime()-Date.now())/1000));
  this.remaining.set(left);
  if(left===0){this.finish();}
 }
 timeText():string {const s=this.remaining();return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
 isSelected(id:number,value:string):boolean{return !!this.attempt?.answers.find(a=>a.questionId===id)?.selected.includes(value);}
 toggle(id:number,value:string,event:Event):void {
  if(!this.attempt)return;
  const checked=(event.target as HTMLInputElement).checked;
  const q=this.questions.find(x=>x.id===id); if(!q)return;
  let selected=this.attempt.answers.find(a=>a.questionId===id)?.selected ?? [];
  selected=q.correctOptions.length>1?(checked?[...selected,value]:selected.filter(x=>x!==value)):(checked?[value]:[]);
  this.data.updateAnswer(this.attempt.id,{questionId:id,selected});
  this.attempt=this.data.attempts().find(a=>a.id===this.attempt!.id);
 }
 finish():void {
  if(!this.attempt)return;
  const result=this.data.finish(this.attempt.id);
  if(result)this.router.navigate(['/results']);
 }
 ngOnDestroy():void {if(this.interval)clearInterval(this.interval);}
}