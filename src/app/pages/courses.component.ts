import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError, of } from 'rxjs';
import { DataService } from '../data.service';
import { AsyncPipe } from '@angular/common';
@Component({standalone:true,imports:[CommonModule,RouterLink,ReactiveFormsModule,AsyncPipe],template:`
<section class="hero"><p class="eyebrow">ОБУЧЕНИЕ И ПРОВЕРКА ЗНАНИЙ</p><h1>Мои курсы</h1><p>Изучайте уроки, проходите тесты и отслеживайте свой прогресс.</p></section>
<div class="search"><input [formControl]="search" placeholder="Поиск курсов..."><span>Поиск с задержкой 300 мс</span></div>
<div class="grid"><article class="card" *ngFor="let c of (filtered$ | async)"><div class="tag">КУРС</div><h2>{{c.title}}</h2><p>{{c.description}}</p><p class="muted">{{c.lessonIds.length || lessonsCount}} урока</p><a class="link" [routerLink]="['/lesson', firstLesson]">Открыть курс →</a></article></div>
<div class="card" *ngIf="!data.courses().length">Пока нет курсов.</div>
`,styles:[]})
export class CoursesComponent {
 data=inject(DataService);
 search=new FormControl('',{nonNullable:true});
 lessonsCount=this.data.lessons().length;
 firstLesson=this.data.lessons()[0]?.id ?? 1;
 filtered$=this.search.valueChanges.pipe(startWith(''),debounceTime(300),distinctUntilChanged(),switchMap(q=>this.data.searchLocal(q)),catchError(()=>of([])));
}