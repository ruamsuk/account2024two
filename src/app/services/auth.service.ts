import { inject, Injectable } from '@angular/core';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import {
  Auth,
  authState,
  getAuth,
  IdTokenResult,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  user,
  User,
  UserCredential,
} from '@angular/fire/auth';
import { ProfileUser } from '../models/profile-user.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  auth = inject(Auth);
  firestore = inject(Firestore);
  router = inject(Router);
  http = inject(HttpClient);
  //
  currentUser$: Observable<User | null> = authState(this.auth);
  currentUser = toSignal<User | null>(this.currentUser$);
  private timeout: any;

  constructor() {
    this.startTimer();
    this.getUserState().subscribe((user) => {
      if (user) {
        this.resetTimer();
      }
    });
  }

  get userProfile$(): Observable<ProfileUser | null> {
    const user = this.auth.currentUser;
    const ref = doc(this.firestore, 'users', `${user?.uid}`);
    if (ref) {
      return docData(ref) as Observable<ProfileUser | null>;
    } else {
      return of(null);
    }
  }

  getTranslations(): Observable<any> {
    return this.http.get<any>('/assets/i18n/th.json');
  }

  startTimer() {
    this.timeout = setTimeout(
      () => {
        this.logout().then(() => {
          console.log('logout');
          this.router.navigateByUrl('/auth/login');
        });
      },
      30 * 60 * 1000,
    ); // 30 นาที
  }

  resetTimer() {
    clearTimeout(this.timeout);
    this.startTimer();
  }

  login(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  forgotPassword(email: string) {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  async logout(): Promise<void> {
    return await signOut(this.auth);
  }

  async sendEmailVerification(): Promise<void | undefined> {
    return await sendEmailVerification(<User>this.auth.currentUser);
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  getUserState(): Observable<any> {
    return user(this.auth);
  }

  getIdTokenResult(): Promise<IdTokenResult> | any {
    return getAuth().currentUser?.getIdTokenResult();
  }

  async isAdmin(): Promise<boolean> {
    let idTokenResult = await this.getIdTokenResult();
    if (idTokenResult) {
      return (
        idTokenResult.claims['role'] === 'admin' ||
        idTokenResult.claims['role'] === 'manager'
      );
    } else {
      return false;
    }
  }
}
