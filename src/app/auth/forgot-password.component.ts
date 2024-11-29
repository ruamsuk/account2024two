import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthService } from '../services/auth.service';
import { MessagesService } from '../services/messages.service';
import { take } from 'rxjs';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="flex justify-content-center align-content-center">
      <input
        pInputText
        type="email"
        [formControl]="emailForgotPassword"
        placeholder="กรอกอีเมล์ที่ลงทะเบียนไว้"
      />
    </div>
    <div class="flex justify-content-center align-content-center gap-3 mt-3">
      <button
        pButton
        type="submit"
        class=""
        size="small"
        [disabled]="loading"
        (click)="forgotPassword()"
      >
        @if (!loading) {
          <span>reset password</span>
        } @else {
          <span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
        }
      </button>
    </div>
  `,
  styles: ``,
})
export class ForgotPasswordComponent {
  emailForgotPassword = new FormControl();
  loading = false;

  constructor(
    private authService: AuthService,
    private messageService: MessagesService,
    private dialogRef: DynamicDialogRef,
  ) {}

  forgotPassword() {
    if (this.emailForgotPassword.value == null) {
      this.messageService.addMessage(
        'error',
        'Error',
        'Please enter a valid email address.',
      );
      return;
    }

    this.loading = true;

    let email = this.emailForgotPassword.value;
    console.log(typeof email, 'email ', email);

    this.authService
      .forgotPassword(email)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.messageService.addMessage(
            'success',
            'Success',
            'Email sent successfully.',
          );
        },
        error: (error: any) => {
          this.messageService.addMessage('error', 'Error', error.message);
        },
        complete: () => {
          this.loading = false;
          this.dialogRef.close(true);
        },
      });
  }
}
