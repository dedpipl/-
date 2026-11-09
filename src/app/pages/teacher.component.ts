import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DataService } from '../data.service';
function courseLessonValidator(control:AbstractControl):ValidationErrors|null {
 const title=control.get('title')?.value?.trim();
 const description=control.get('description')?.value?.trim();
 return title&&description?null:{bothRequired:true};
}
@Component({standalone:true,imports:[CommonModule,ReactiveFormsModule],template:`
<p class="eyebrow">ПАНЕЛЬ УПРАВЛЕНИЯ</p><h1>Панель преподавателя</h1>
<div class="stats"><div class="card"><span>Завершённые попытки</span><strong>{{data.completedCount()}}</strong></div><div class="card"><span>Средний балл</span><strong>{{data.averageScore()}}%</strong></div></div>
<section class="card"><h2>Добавить курс</h2><form [formGroup]="courseForm" (ngSubmit)="addCourse()"><input formControlName="title" placeholder="Название курса"><textarea formControlName="description" placeholder="Описание курса"></textarea><p class="error" *ngIf="courseForm.touched&&courseForm.invalid">Заполните название и описание.</p><button class="button" [disabled]="courseForm.invalid">Создать курс</button></form></section>
<section class="card"><h2>Добавить урок</h2><form [formGroup]="lessonForm" (ngSubmit)="addLesson()"><select formControlName="courseId"><option *ngFor="let c of data.courses()" [ngValue]="c.id">{{c.title}}</option></select><input formControlName="title" placeholder="Название урока"><textarea formControlName="content" placeholder="Материал урока"></textarea><button class="button" [disabled]="lessonForm.invalid">Добавить урок</button></form></section>
<section class="card"><h2>Сложность вопросов</h2><p class="muted">Сложность оценивается по доле верных ответов среди завершённых попыток.</p><div *ngFor="let q of data.questionDifficulty()" class="difficulty"><div>{{q.question}} <strong>{{q.correctRate}}% верных</strong></div><div class="bar"><span [style.width.%]="q.correctRate"></span></div><small>{{q.responses}} ответов</small></div></section>
<section class="card"><h2>Все результаты</h2><div *ngFor="let r of data.results()" class="result-row"><span>Попытка #{{r.attemptId}}</span><strong>{{r.score}} / {{r.maxScore}}</strong></div></section>`})
export class TeacherComponent {
 data=inject(DataService); fb=inject(FormBuilder);
 courseForm=this.fb.group({title:['',Validators.required],description:['',Validators.required]},{validators:courseLessonValidator});
 lessonForm=this.fb.group({courseId:[1,Validators.required],title:['',Validators.required],content:['',Validators.required]});
 addCourse():void{if(this.courseForm.invalid)return;const v=this.courseForm.getRawValue();this.data.addCourse(v.title!,v.description!);this.courseForm.reset();}
 addLesson():void{if(this.lessonForm.invalid)return;const v=this.lessonForm.getRawValue();this.data.addLesson(Number(v.courseId),v.title!,v.content!);this.lessonForm.reset({courseId:1,title:'',content:''});}
}