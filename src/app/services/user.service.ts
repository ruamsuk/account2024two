import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { from, map, Observable, of, Subject, switchMap } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import firebase from 'firebase/compat/app';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { ProfileUser } from '../models/profile-user.model';
import { AuthService } from './auth.service';

export type CreateUserRequest = {
  displayName: string;
  password: string;
  email: string;
  role: string;
};
export type UpdateUserRequest = { uid: string } & CreateUserRequest;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  afAuth = inject(AngularFireAuth);
  authService = inject(AuthService);
  firestore = inject(Firestore);
  http = inject(HttpClient);
  fns = inject(AngularFireFunctions);
  baseUrl = environment.production
    ? `https://us-central1-${environment.firebaseConfig.projectId}.cloudfunctions.net/apiFunction/users`
    : `http://localhost:5001/${environment.firebaseConfig.projectId}/us-central1/apiFunction/users`;
  form = new FormGroup({
    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    displayName: new FormControl(''),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    role: new FormControl('', [Validators.required]),
  });
  private userUpdated = new Subject<void>();

  constructor() {}

  get users$(): Observable<User[]> {
    return this.http.get<{ users: User[] }>(`${this.baseUrl}`).pipe(
      map((result) => {
        return result.users;
      }),
    );
  }

  get currentUserProfile$(): Observable<ProfileUser | null> {
    return this.authService.currentUser$.pipe(
      switchMap((user: any) => {
        if (user?.uid) {
          const ref = doc(this.firestore, 'users', user?.uid);
          return docData(ref) as Observable<ProfileUser>;
        } else {
          return of(null);
        }
      }),
    );
  }

  user$(id: string | null): Observable<User> {
    return this.http.get<{ user: User }>(`${this.baseUrl}/${id}`).pipe(
      map((result) => {
        return result.user;
      }),
    );
  }

  create(user: CreateUserRequest) {
    console.log('create user ', user);
    return this.http
      .post<{ uid: string }>(`${this.baseUrl}`, user)
      .pipe(map((res) => res));
  }

  edit(user: UpdateUserRequest) {
    return this.http.patch(`${this.baseUrl}/${user.uid}`, user).pipe(
      map((res) => {
        this.userUpdated.next();
        return res;
      }),
    );
  }

  updatePhotoURL(uid: string, photoURL: string) {
    // console.log('update photoURL', uid, ' | ', photoURL);
    // console.log(`${this.baseUrl}/${uid}/photo`);
    return this.http
      .patch(`${this.baseUrl}/${uid}/photo`, { photoURL: photoURL })
      .pipe(
        map((res) => {
          this.userUpdated.next();
          return res;
        }),
      );
  }

  delete(user: UpdateUserRequest) {
    return this.http.delete(`${this.baseUrl}/${user.uid}`);
  }

  /**
   * update photoURL
   * */
  updateUserPhotoURL(uid: string, photoURL: string) {
    const callable = this.fns.httpsCallable('updateUserPhotoURL');
    return callable({ uid, photoURL });
  }

  /** User Firestore */

  update(user: any) {
    const ref = doc(this.firestore, 'users', `${user.uid}`);
    return from(updateDoc(ref, { ...user }));
  }

  newUser(user: any) {
    const email = firebase.auth().currentUser?.email;
    const userRole =
      typeof user.role === 'object' && user.role !== null
        ? (user.role as { name: string }).name
        : user.role;

    const fakeData = {
      uid: user.uid,
      displayName: user.displayName,
      email: email || '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      role: userRole,
    };
    const ref = doc(this.firestore, 'users', `${user?.uid}`);
    return from(setDoc(ref, fakeData));
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`, {
      withCredentials: true,
    });
  }

  getUserById(id: string): Observable<any> {
    console.log(`${this.baseUrl}/${id}`);
    return this.http.get(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user, {
      withCredentials: true,
    });
  }

  updateUser(id: string | null | undefined, user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, user, {
      withCredentials: true,
    });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, {
      withCredentials: true,
    });
  }

  async sendVerifyEmail(): Promise<void | undefined> {
    return await this.afAuth.currentUser.then((user) => {
      return user?.sendEmailVerification();
    });
  }
}
