import { Component, inject, OnDestroy } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthService } from '../services/auth.service';
import { combineLatest, concatMap, Observable, take } from 'rxjs';
import { SharedModule } from '../shared/shared.module';
import { FormControl, FormGroup } from '@angular/forms';
import { User } from '../models/user.model';
import { ImageUploadService } from '../services/image-upload.service';
import { MessagesService } from '../services/messages.service';
import { UserService } from '../services/user.service';
import firebase from 'firebase/compat/app';
import { getAuth } from '@angular/fire/auth';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [SharedModule, NgOptimizedImage],
  template: `
    <hr class="h-px bg-gray-200 border-0" />
    <div *ngIf="user$ | async as user">
      <div class="flex justify-content-center">
        <div class="profile-image">
          <img
            [ngSrc]="user.photoURL ?? '/images/dummy-user.png'"
            alt="photo"
            width="120"
            height="120"
          />
          <p-button
            id="in"
            icon="pi pi-pencil"
            severity="success"
            [rounded]="true"
            [raised]="true"
            (click)="inputField.click()"
          />
        </div>
        <input
          #inputField
          type="file"
          hidden="hidden"
          (change)="uploadImage($event, user)"
        />
      </div>
      <div class="card flex flex-wrap flex-column justify-content-center mt-3">
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <div class="field">
            <label for="display">Display Name:</label>
            <input pInputText formControlName="displayName" class="w-full" />
          </div>
          <div class="field">
            <label for="firstName">First Name:</label>
            <input pInputText formControlName="firstName" class="w-full" />
          </div>
          <div class="field">
            <label for="lastName">Last Name:</label>
            <input pInputText formControlName="lastName" class="w-full" />
          </div>
          <div class="field">
            <label for="email">Email:</label>
            <input pInputText formControlName="email" class="w-full" />
            <small class="text-gray-400 font-italic ml-1">
              Email cannot be edited.
            </small>
          </div>
          <div class="field">
            <label for="email">Role:</label>
            <input pInputText formControlName="role" class="w-full" />
            <small class="text-gray-400 font-italic ml-1">
              Role cannot be edited.
            </small>
          </div>
          <div class="field">
            <div
              class="flex justify-content-center text-green-400 cursor-pointer"
            >
              @if (verify) {
                <i class="pi pi-verified"></i>
                <span class=" ml-2">Verified user.</span>
              } @else if (!verify) {
                <div class="text-orange-500" (click)="sendEmail()">
                  <i class="pi pi-send"></i>
                  <span class=" ml-2">Click to Verified email.</span>
                </div>
              }
            </div>
          </div>
          <div class="field">
            <label for="phone">Phone Number:</label>
            <input pInputText formControlName="phone" class="w-full" />
          </div>
          <div class="field">
            <label for="address">Address</label>
            <textarea
              rows="5"
              pInputTextarea
              formControlName="address"
              class="w-full"
            ></textarea>
          </div>
          <div class="field">
            <hr class="h-px bg-gray-200 border-0" />
            <div class="flex mt-3">
              <p-button
                label="Cancel"
                severity="secondary"
                styleClass="w-full"
                class="w-full mr-2"
                (onClick)="close()"
              />
              <p-button
                label="Save"
                styleClass="w-full"
                class="w-full"
                (onClick)="saveProfile()"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: `
    .profile-image > img {
      border-radius: 100%;
      object-fit: cover;
      object-position: center;
    }

    .profile-image {
      position: relative;
    }

    .profile-image > #in {
      position: absolute;
      bottom: 10px;
      left: 80%;
    }

    .container-form {
      max-width: 600px;
    }

    .row {
      display: flex;
      gap: 16px;
    }

    .field > label {
      color: #000000;
      margin-left: 5px;
    }

    .p-inputtext {
      font-family: 'Sarabun', sans-serif !important;
    }

    label {
      color: grey !important;
    }
  `,
})
export class UserDetailComponent implements OnDestroy {
  authService = inject(AuthService);
  userService = inject(UserService);
  imageService = inject(ImageUploadService);
  message = inject(MessagesService);
  ref = inject(DynamicDialogRef);
  router = inject(Router);
  user$: Observable<any> = this.authService.currentUser$;
  disabled: boolean = true;
  user: any;
  role: string | null = null;
  verify: boolean | undefined = false;

  profileForm = new FormGroup({
    uid: new FormControl(''),
    displayName: new FormControl(''),
    email: new FormControl({ value: '', disabled: this.disabled }),
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    phone: new FormControl(''),
    address: new FormControl(''),
    role: new FormControl({ value: '', disabled: this.disabled }),
  });

  constructor() {
    const auth = getAuth();
    const id = auth.currentUser?.uid;
    this.verify = auth.currentUser?.emailVerified;

    combineLatest([
      this.authService.currentUser$,
      this.authService.userProfile$,
    ])
      .pipe(take(1))
      .subscribe(([authUser, userProfile]) => {
        const combineUser = { ...authUser, ...userProfile };
        this.profileForm.patchValue(combineUser);
      });

    this.getRole();
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }

  uploadImage(event: any, user: User) {
    const file = event.target.files[0];
    this.imageService
      .uploadImage(file, `images/profile/${user.uid}`)
      .pipe(
        concatMap((photoURL) =>
          this.authService.updateProfile({
            uid: user.uid,
            photoURL,
          }),
        ),
      )
      .subscribe();
  }

  getRole() {
    firebase
      .auth()
      .currentUser?.getIdTokenResult()
      .then((idTokenResult) => {
        if (!!idTokenResult.claims['admin']) {
        }
        this.role = idTokenResult.claims['role'];
      });
  }

  saveProfile() {
    const profileData = this.profileForm.value;
    /**
     * แก้ไขกรณี role เป็น object = { name: user }
     * ให้เป็น user หรือค่าของ name เท่านั้น ถ้าไม่ใช่ object
     * ก็เอาค่าไปใช้ได้เลย
     * */
    const userRole =
      typeof this.role === 'object' && this.role !== null
        ? (this.role as { name: string }).name
        : this.role;

    this.userService
      .newUser({
        uid: profileData.uid,
        email: profileData.email,
        displayName: profileData.displayName,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        address: profileData.address,
        role: userRole,
      })
      .pipe()
      .subscribe({
        complete: () => {
          this.ref.close(true);
          this.message.addMessage('success', 'Successfully', 'Profile saved');
        },
        error: (error) =>
          this.message.addMessage('error', 'Error', error.message),
      });
  }

  close() {
    this.ref.close();
  }

  sendEmail() {
    this.userService
      .sendVerifyEmail()
      .then(() => {
        this.message.addMessage('success', 'Successfully', 'Email sent');
        this.authService.logout();
        this.router.navigateByUrl('/auth/login');
      })
      .catch((error) =>
        this.message.addMessage('error', 'Error', error.message),
      );
  }
}
