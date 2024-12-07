import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedModule } from '../shared/shared.module';
import { ImageUploadService } from '../services/image-upload.service';
import { MessagesService } from '../services/messages.service';
import { concatMap, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div>
      <!--/ การเปลี่ยนภาพและรายละเอียดอื่น ทำได้แล้ว เย้ๆ -->
      <div class="flex justify-content-center align-items-center">
        <div class="profile-image">
          <img
            height="120"
            width="120"
            [ngSrc]="
              previewUrl
                ? previewUrl
                : user?.photoURL
                  ? user.photoURL
                  : 'images/dummy-user.png'
            "
            alt="photo"
          />
          <p-button
            id="in"
            icon="pi pi-pencil"
            severity="success"
            [rounded]="true"
            [raised]="true"
            (click)="inputField.click()"
          />
          <input
            #inputField
            type="file"
            hidden="hidden"
            (change)="onFileSelected($event)"
          />
        </div>
      </div>

      <hr class="h-px bg-gray-200 border-0"/>
      <form [formGroup]="userForm" (ngSubmit)="saveUser()">
        <input type="hidden"/>
        <div class="field">
          <label for="displayName">DisplayName</label>
          <input
            type="text"
            id="displayName"
            pInputText
            formControlName="displayName"
            name="displayName"
            class="w-full mb-2"
          />
          <div class="field">
            <label for="email">Email</label>
            <input
              type="text"
              id="email"
              pInputText
              formControlName="email"
              name="email"
              class="w-full"
            />
          </div>
        </div>
        <div class="field">
          <label for="password">Password</label>
          <p-password
            id="password"
            class="w-full {{ isValidPassword ? 'ng-invalid ng-dirty' : '' }}"
            [feedback]="false"
            formControlName="password"
            styleClass="p-password p-component p-inputwrapper p-input-icon-right"
            [style]="{ width: '100%' }"
            [inputStyle]="{ width: '100%' }"
            [toggleMask]="true"
          />
          <small
            class="block p-error pl-2 font-semibold"
            *ngIf="isValidPassword as messages"
          >
            {{ messages }}
          </small>
        </div>

        <div class="field">
          <label for="role">Role</label>
          <p-autoComplete
            id="role"
            formControlName="role"
            [dropdown]="true"
            [suggestions]="filteredRoles"
            (completeMethod)="filterRoles($event)"
            optionLabel="name"
            placeholder="Select roles"
            styleClass="w-full"
            appendTo="body"
          />
        </div>
        <div class="field">
          <hr class="h-px bg-gray-200 border-0"/>
          <div class="flex mt-2 mb-1">
            <p-button
              label="Cancel"
              severity="secondary"
              styleClass="w-full"
              class="w-full mr-2"
              (onClick)="close('')"
            />
            <p-button
              label="Save"
              [disabled]="userForm.invalid"
              styleClass="w-full"
              class="w-full"
              (onClick)="saveUser()"
            />
          </div>
        </div>
      </form>
    </div>
  `,
  styles: `
    label {
      margin-left: 5px;
    }

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

    .profile-image > button {
      position: absolute;
      bottom: 10px;
      right: 25%;
    }
  `,
})
export class UserEditComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  user: any;
  roles: any[] = [{name: 'admin'}, {name: 'manager'}, {name: 'user'}];
  filteredRoles: any[] = [];
  previewUrl: string | ArrayBuffer | null = null;
  private userUpdatedSub!: Subscription;

  constructor(
    public userService: UserService,
    private ref: DynamicDialogRef,
    private imageService: ImageUploadService,
    private config: DynamicDialogConfig,
    private message: MessagesService,
  ) {
    this.userForm = new FormGroup<any>({
      uid: new FormControl(''),
      email: new FormControl('', [Validators.required, Validators.email]),
      displayName: new FormControl(''),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      role: new FormControl(''),
      profileImage: new FormControl(null),
    });

    if (this.config.data) {
      const data = this.config.data;
      if (data) {
        this.user = data;
        this.userForm.patchValue({...data});
        // console.log(JSON.stringify(this.user, null, 2));
      }
    }
  }

  get isValidPassword(): any {
    const control = this.userForm.get('password');
    const isInvalid = control?.invalid && control.touched;
    if (isInvalid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter >= 6 character & numeric';
    }
  }

  ngOnInit() {
  }

  filterRoles(event: any) {
    // กรองข้อมูลตาม query ที่ผู้ใช้พิมพ์
    let filtered: any[] = [];
    let query = event.query;
    for (let i = 0; i < this.roles.length; i++) {
      let role = this.roles[i];
      if (role.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(role);
      }
    }

    this.filteredRoles = filtered;
  }

  saveUser() {
    const userData = this.userForm.value;
    const roleName =
      typeof userData.role === 'object' ? userData.role.name : userData.role;

    const fakeData = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      password: userData.password,
      role: roleName,
    };

    // console.log(JSON.stringify(fakeData, null, 2));

    if (this.config.data) {
      // กรณีแก้ไขผู้ใช้เดิม
      this.userUpdatedSub = (
        userData.profileImage
          ? this.imageService
            .uploadImage(
              userData.profileImage,
              `images/profile/${userData.uid}`,
            )
            .pipe(
              concatMap((photoURL) =>
                this.userService.updatePhotoURL(userData.uid, photoURL),
              ),
              concatMap(() => this.userService.edit(fakeData)),
            )
          : this.userService.edit(fakeData)
      ).subscribe({
        next: () => {
          this.message.addMessage(
            'success',
            'Successfully',
            'Successfully Updated!',
          );
        },
        error: (err) => {
          this.message.addMessage('error', 'Error', err.message);
        },
        complete: () => this.close('edit'),
      });
    } else {
      // กรณีสร้างผู้ใช้ใหม่
      this.userService
        .create(fakeData)
        .pipe(
          concatMap((response) => {
            const uid = response.uid;
            if (userData.profileImage) {
              return this.imageService
                .uploadImage(userData.profileImage, `images/profile/${uid}`)
                .pipe(
                  concatMap((photoURL) =>
                    this.userService.updatePhotoURL(uid, photoURL),
                  ),
                );
            } else {
              return of(null);
            }
          }),
        )
        .subscribe({
          next: () => {
            this.message.addMessage(
              'success',
              'SuccessFully',
              'Successfully created!',
            );
          },
          error: (err) => {
            this.message.addMessage('error', 'Error', err.message);
          },
          complete: () => this.close('new'),
        });
    }
  }

  close(type: string) {
    this.ref.close(type);
  }

  ngOnDestroy() {
    if (this.userUpdatedSub) this.userUpdatedSub.unsubscribe();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.userForm.patchValue({profileImage: file});
      this.userForm.get('profileImage')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
