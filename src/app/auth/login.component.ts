import { Component, inject, OnDestroy } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { MessagesService } from '../services/messages.service';
import { ForgotPasswordComponent } from './forgot-password.component';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule, CheckboxModule],
  template: `
    <div class="flex justify-content-center flex-wrap">
      <div class="flex justify-content-center align-items-center h-screen">
        <form [formGroup]="loginForm" (ngSubmit)="login()">
          <p-card [style]="{ width: '360px' }">
            <div class="text-center text-3xl -mt-4">
              <img src="/images/primeng-logo.png" alt="logo"/>
              <div class="text-900 text-2xl font-medium mb-3">ruamsuk acc.</div>
            </div>
            <ng-template pTemplate="p-card-content">
              <div class="field">
                @if (isEmailValid) {
                  <label [ngClass]="{ 'p-error': isEmailValid }">Email</label>
                } @else {
                  <label>Email</label>
                }
                <input
                  type="email"
                  pInputText
                  formControlName="email"
                  class="w-full {{ isEmailValid ? 'ng-invalid ng-dirty' : '' }}"
                  name="email"
                  autocomplete="email"
                />
                @if (isEmailValid; as message) {
                  <small class="block p-error pl-2 font-semibold">
                    {{ message }}
                  </small>
                }
              </div>
              <div class="field">
                @if (isValidPassword) {
                  <label [ngClass]="{ 'p-error': isValidPassword }"
                  >Password</label
                  >
                } @else {
                  <label>Password</label>
                }
                <p-password
                  class="w-full {{
                    isValidPassword ? 'ng-invalid ng-dirty' : ''
                  }}"
                  [feedback]="false"
                  formControlName="password"
                  styleClass="p-password p-component p-inputwrapper p-input-icon-right"
                  [style]="{ width: '100%' }"
                  [inputStyle]="{ width: '100%' }"
                  [toggleMask]="true"
                  autocomplete="password"
                />
                @if (isValidPassword; as messages) {
                  <small class="block p-error pl-2 font-semibold">
                    {{ messages }}
                  </small>
                }
                <div class="mt-2">
                  <span
                    class="sarabun text-blue-600 font-italic cursor-pointer hover:text-red-600"
                    (click)="forgotPassword()"
                  >
                    ลืมรหัสผ่าน
                  </span>
                </div>
              </div>
            </ng-template>
            <ng-template pTemplate="footer">
              <div class="flex gap-3 -mt-5">
                <p-button
                  label="Login"
                  class="w-full"
                  styleClass="w-full"
                  [disabled]="loginForm.invalid"
                  type="submit"
                  [loading]="loading"
                />
              </div>
              <div class="mt-2 ml-2">
                Not a member?
                <a routerLink="" class="cursor-pointer" (click)="addMessage()">
                  <span class="text-blue-600>Register">Register</span>
                </a>
              </div>
            </ng-template>
          </p-card>
        </form>
      </div>
    </div>
  `,
  styles: ``,
})
export class LoginComponent implements OnDestroy {
  ref!: DynamicDialogRef;
  loading: boolean = false;

  formBuilder = inject(FormBuilder);
  authService = inject(AuthService);
  messageService = inject(MessageService);
  message = inject(MessagesService);
  router = inject(Router);
  dialogService = inject(DialogService);

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get isEmailValid(): string | boolean {
    const control = this.loginForm.get('email');

    const isInvalid = control?.invalid && control.touched;

    if (isInvalid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid email';
    }

    return false;
  }

  get isValidPassword(): string | boolean {
    const control = this.loginForm.get('password');
    const isInvalid = control?.invalid && control.touched;

    if (isInvalid) {
      if (control.hasError('required')) {
        return 'This field is required';
      } else if (control.hasError('minlength')) {
        return 'Password must be at least 6 characters long';
      } else {
        return 'Enter a valid password';
      }
    }

    return false;
  }

  login(): void {
    this.load(true);
    const {email, password} = this.loginForm.value;

    if (!this.loginForm.valid || !email || !password) {
      return;
    }

    this.authService.login(email, password).subscribe({
      next: () => {
        this.message.addMessage(
          'success',
          'Successfully',
          'Successfully logged in',
        );
        setTimeout(() => {
          this.router.navigateByUrl('/home').then();
        }, 500);
      },
      error: (err) => {
        this.message.addMessage(
          'error',
          'Error',
          `Unable to login: ${err.code}`,
        );
        this.load(false);
      },
      complete: () => {
        this.load(false);
      },
    });
  }

  forgotPassword() {
    this.ref = this.dialogService.open(ForgotPasswordComponent, {
      header: 'Forgot your password',
      width: '350px',
      modal: true,
      contentStyle: {overflow: 'auto'},
      breakpoints: {
        '960px': '350px',
        '640px': '350px',
      },
    });
  }

  load(style: boolean) {
    this.loading = style;
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }

  addMessage() {
    this.messageService.add({
      severity: 'info',
      summary: 'Info Message',
      detail:
        'Not yet available.\n尚未开放服务\n아직 서비스되지 않습니다.\nAún no disponible.',
    });
  }
}
