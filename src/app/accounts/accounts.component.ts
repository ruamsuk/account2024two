import { Component, inject, OnDestroy } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Account } from '../models/account.model';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AccountService } from '../services/account.service';
import { MessagesService } from '../services/messages.service';
import { NgxCurrencyDirective } from 'ngx-currency';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [SharedModule, NgxCurrencyDirective],
  template: `
    <div>
      <hr class="h-px bg-gray-200 border-0" />
      <form [formGroup]="accountForm" (ngSubmit)="saveAccount()">
        <input type="hidden" /><!--/ focus this element -->
        <div class="field">
          @if (isDateValid) {
            <label [ngClass]="{ 'p-error': isDateValid }" for="date"
              >วันที่ทำรายการ</label
            >
          } @else {
            <label for="date">วันที่ทำรายการ</label>
          }
          <p-calendar
            [iconDisplay]="'input'"
            [showIcon]="true"
            [inputStyle]="{ width: '90vw' }"
            appendTo="body"
            inputId="icondisplay"
            formControlName="date"
            name="date"
            class="w-full"
            dateFormat="d M yy"
          />
          @if (isDateValid; as messages) {
            <small class="block p-error pl-2 font-semibold">
              {{ messages }}
            </small>
          }
        </div>
        <div class="field">
          @if (isDetailsValid) {
            <label [ngClass]="{ 'p-error': isDetailsValid }" for="details"
              >รายการ</label
            >
          } @else {
            <label for="details">รายการ</label>
          }
          <input
            pInputText
            formControlName="details"
            name="details"
            class="w-full"
          />
          @if (isDetailsValid; as messages) {
            <small class="block p-error pl-2 font-semibold">
              {{ messages }}
            </small>
          }
        </div>
        <div class="field">
          @if (isAmountValid) {
            <label [ngClass]="{ 'p-error': isAmountValid }" for="amount"
              >จำนวนเงิน</label
            >
          } @else {
            <label>จำนวนเงิน</label>
          }
          <input
            class="w-full"
            pInputText
            currencyMask
            formControlName="amount"
          />
          @if (isAmountValid; as messages) {
            <small class="block p-error pl-2 font-semibold">
              {{ messages }}
            </small>
          }
        </div>
        <div class="field">
          <label for="remark">หมายเหตุ</label>
          <input
            pInputText
            formControlName="remark"
            name="remark"
            class="w-full"
          />
        </div>
        <div class="flex justify-content-start">
          <p-inputSwitch formControlName="isInCome" />
          @if (accountForm.controls['id'].value) {
            @switch (accountForm.controls['isInCome'].value) {
              @case (true) {
                <span class="sarabun text-green-400 ml-2">รายรับ</span>
              }
              @case (false) {
                <span class="sarabun text-red-500 ml-2">รายจ่าย</span>
              }
              @default {
                <span class="sarabun text-green-400 ml-2">รายรับ</span>
              }
            }
          } @else {
            <span class="sarabun font-bold text-green-400 ml-3">รายรับ</span>
          }
        </div>
        <div class="field">
          <hr class="h-px bg-gray-200 border-0 mb-1" />
          <div class="flex mt-2 mb-1">
            <p-button
              label="Cancel"
              severity="secondary"
              styleClass="w-full"
              class="w-full mr-2"
              (onClick)="close(false)"
            />
            <p-button
              label="Save"
              [disabled]="accountForm.invalid"
              styleClass="w-full"
              class="w-full"
              (onClick)="saveAccount()"
            />
          </div>
        </div>
      </form>
    </div>
  `,
  styles: `
    label,
    input {
      font-family: Sarabun, sans-serif;
    }
  `,
})
export class AccountsComponent implements OnDestroy {
  message = inject(MessagesService);
  accountService = inject(AccountService);
  ref = inject(DynamicDialogRef);
  acc = inject(DynamicDialogConfig);

  account!: Account;

  accountForm = new FormGroup({
    id: new FormControl(null),
    date: new FormControl('', Validators.required),
    details: new FormControl('', Validators.required),
    amount: new FormControl('', Validators.required),
    create: new FormControl(''),
    modify: new FormControl(''),
    isInCome: new FormControl(false),
    remark: new FormControl(''),
  });

  constructor() {
    if (this.acc.data) {
      this.account = this.acc.data;
      this.accountForm.patchValue({
        id: this.acc.data.id,
        date: this.acc.data.date.toDate(),
        details: this.acc.data.details,
        amount: this.acc.data.amount,
        create: this.acc.data.create,
        modify: this.acc.data.modify,
        isInCome: this.acc.data.isInCome,
        remark: this.acc.data.remark,
      });
    }
  }

  get isDateValid(): any {
    const control = this.accountForm.get('date');
    const isInValid = control?.invalid && control.touched;
    if (isInValid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid date';
    }
  }

  get isDetailsValid(): any {
    const control = this.accountForm.get('details');
    const isInValid = control?.invalid && control.touched;
    if (isInValid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid date';
    }
  }

  get isAmountValid(): any {
    const control = this.accountForm.get('amount');
    const isInValid = control?.invalid && control.touched;
    if (isInValid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid amount';
    }
  }

  saveAccount() {
    if (this.accountForm.invalid) return;

    const account = this.accountForm.value;
    if (this.acc.data) {
      this.accountService.updateAccount(account).subscribe({
        next: () => {
          this.message.addMessage(
            'success',
            'Successfully',
            'Updated account successfully.',
          );
        },
      });
    } else {
      this.accountService.addAccount(account).subscribe({
        next: () =>
          this.message.addMessage(
            'success',
            'Successfully',
            'Added account successfully.',
          ),
        error: (error: any) =>
          this.message.addMessage('error', 'Error', `${error.message}`),
      });
    }
    this.close(true);
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }

  close(edit: boolean) {
    this.ref.close(edit);
  }
}
