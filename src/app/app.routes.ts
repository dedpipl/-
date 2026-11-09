import { Routes } from '@angular/router';
import { CoursesComponent } from './pages/courses.component';
import { LessonComponent } from './pages/lesson.component';
import { TestComponent } from './pages/test.component';
import { ResultsComponent } from './pages/results.component';
import { TeacherComponent } from './pages/teacher.component';
export const routes: Routes = [
 {path:'',component:CoursesComponent},
 {path:'lesson/:id',component:LessonComponent},
 {path:'test/:id',component:TestComponent},
 {path:'results',component:ResultsComponent},
 {path:'teacher',component:TeacherComponent},
 {path:'**',redirectTo:''}
];