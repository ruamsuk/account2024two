import { Component, effect, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Observable, take } from 'rxjs';
import { getAuth } from '@angular/fire/auth';
import { SharedModule } from '../shared/shared.module';
import { MessagesService } from '../services/messages.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [Button, SharedModule],
  template: `
    <hr class="h-px bg-gray-200 border-0" />
    <div class="card mt-3 mb-3">
      <!--/ progress bar here -->
    </div>
    <div class="flex justify-content-center">
      <div class="profile-image">
        <img
          [src]="user?.photoURL ?? '/images/dummy-user.png'"
          alt="user-photo"
          width="120"
          height="120"
        />
        <p-button
          id="in"
          icon="pi pi-pencil"
          severity="success"
          [rounded]="true"
          [raised]="true"
          (onClick)="inputField.click()"
        />
        <input
          #inputField
          type="file"
          hidden="hidden"
          (change)="uploadImage($event, user)"
        />
      </div>
    </div>
    <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
      <div class="formgrid grid">
        <div class="field col">
          <label for="displayName">Display Name</label>
          <input
            pInputText
            type="text"
            class="w-full"
            name="displayName"
            formControlName="displayName"
          />
        </div>
        <div class="field col">
          <label for="email">Email</label>
          <input
            pInputText
            type="text"
            class="w-full"
            name="email"
            formControlName="email"
          />
          <small class="text-gray-400 font-italic ml-1">
            Email cannot be edited.
          </small>
        </div>
        <div class="formgrid grid">
          <div class="field col">
            <label for="firstName">First Name</label>
            <input
              pInputText
              type="text"
              class="w-full"
              name="firstName"
              formControlName="firstName"
            />
          </div>
          <div class="field col">
            <label for="lastName">Last Name</label>
            <input
              pInputText
              type="text"
              class="w-full"
              name="lastName"
              formControlName="lastName"
            />
          </div>
        </div>
        <div class="formgrid grid">
          <div class="field col">
            <label for="phone">Phone</label>
            <input
              pInputText
              type="text"
              class="w-full"
              name="phone"
              formControlName="phone"
            />
          </div>
          <div class="field col">
            <label for="role">Role</label>
            <input
              pInputText
              type="text"
              class="w-full"
              name="role"
              formControlName="role"
            />
            <small class="text-gray-400 font-italic ml-1">
              Role cannot be edited.
            </small>
          </div>
        </div>
      </div>
      <div class="field col">
        <div class="flex justify-content-center text-green-400 cursor-pointer">
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
      <div class="field col -mt-4">
        <label for="address">Address</label>
        <textarea
          rows="3"
          pInputTextarea
          formControlName="address"
          class="w-full"
        ></textarea>
      </div>
      <div class="field col -mt-3">
        <hr class="h-px bg-gray-200 border-0" />
        <div class="flex mt-3">
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="w-full"
            class="w-full mr-2"
            (onClick)="closeDialog()"
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

    label {
      color: gray;
      margin-left: 5px;
    }

    .p-inputtext {
      font-family: 'Sarabun', sans-serif !important;
    }
  `,
})
export class UserProfileComponent {
  authService = inject(AuthService);
  router = inject(Router);
  message = inject(MessagesService);
  ref = inject(DynamicDialogRef);

  fb = inject(FormBuilder);

  user: any;
  user$!: Observable<any>;
  verify: boolean | undefined = false;
  role: string | null = null;
  displayName: string | null = null;

  profileForm: FormGroup = this.fb.group({
    uid: this.fb.control('', { nonNullable: true }),
    displayName: new FormControl(''),
    email: new FormControl(''),
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    phone: new FormControl(''),
    address: new FormControl(''),
    role: new FormControl(''),
  });

  constructor() {
    const auth = getAuth();
    this.user = this.authService.currentUser();
    this.user$ = this.authService.currentUser$;
    this.verify = auth.currentUser?.emailVerified;
    effect(() => {
      this.profileForm.patchValue({ ...this.user });
    });
    this.loadUser();
  }

  loadUser() {
    this.authService.userProfile$.pipe(take(1)).subscribe((user: any) => {
      if (user) {
        this.profileForm.patchValue({
          displayName: this.displayName ? this.displayName : user.displayName,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          address: user.address || '',
          role: user.role || '',
        });
        this.role = user.role;
      } else {
        console.error('Unable to get user profile');
      }
    });
  }

  saveProfile() {}

  closeDialog() {
    this.ref.close(true);
  }

  uploadImage(event: any, user: any) {
    this.user = user;
  }

  async sendEmail() {
    await this.authService
      .sendEmailVerification()
      .then(() => {
        this.message.addMessage('success', 'Successfully', 'Email sent');
        this.authService.logout().catch();
        this.router.navigateByUrl('/auth/login').catch();
      })
      .catch((error) =>
        this.message.addMessage('error', 'Error', error.message),
      );
  }
}
