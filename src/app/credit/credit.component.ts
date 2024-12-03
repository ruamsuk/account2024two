import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedModule } from '../shared/shared.module';
import { NgxCurrencyDirective } from 'ngx-currency';
import { CreditService } from '../services/credit.service';
import { MessagesService } from '../services/messages.service';
import { Credit } from '../models/credit.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-credit',
  standalone: true,
  imports: [SharedModule, NgxCurrencyDirective],
  template: `
    <div>
      <hr class="h-px bg-gray-200 border-0" />
      <form [formGroup]="creditForm" (ngSubmit)="saveCredit()">
        <input type="hidden" /><!-- for focus this -->

        <div class="flex">
          <div class="flex align-items-center justify-content-center py-3">
            <p-calendar
              [iconDisplay]="'input'"
              [showIcon]="true"
              [style]="{ width: '150px' }"
              inputId="icondisplay"
              placeholder="วันที่"
              appendTo="body"
              formControlName="date"
              name="date"
              dateFormat="d M yy"
            />
          </div>
          <div
            class="flex align-items-center justify-content-center font-bold py-3 ml-1 border-round w-full"
          >
            <input
              pInputText
              formControlName="details"
              name="details"
              placeholder="รายการ"
              class="w-full"
            />
          </div>
        </div>

        <div class="field">
          <label for="amount">จำนวนเงิน</label>
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

        <div class="flex justify-content-start mt-3">
          <p-inputSwitch formControlName="isCashback" />
          @if (creditForm.controls['id'].value) {
            @switch (creditForm.controls['isCashback'].value) {
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
          <div class="flex mt-2 mb-1 mb-4">
            <p-button
              label="Cancel"
              severity="secondary"
              styleClass="w-full"
              class="w-full mr-2"
              (onClick)="closeDialog()"
            />
            <p-button
              label="Save"
              [disabled]="creditForm.invalid"
              styleClass="w-full"
              class="w-full"
              (onClick)="saveCredit()"
            />
          </div>
        </div>
      </form>
    </div>
  `,
  styles: ``,
})
export class CreditComponent implements OnInit, OnDestroy {
  creditService = inject(CreditService);
  message = inject(MessagesService);
  ref = inject(DynamicDialogRef);
  creditData = inject(DynamicDialogConfig);
  credit!: Credit;

  creditForm = new FormGroup({
    id: new FormControl(null),
    date: new FormControl('', Validators.required),
    details: new FormControl('', Validators.required),
    amount: new FormControl('', Validators.required),
    created: new FormControl(''),
    modify: new FormControl(''),
    isCashback: new FormControl(false),
    remark: new FormControl(''),
  });

  constructor() {
    if (this.creditData.data) {
      this.credit = this.creditData.data;

      this.creditForm.patchValue({
        id: this.creditData.data.id,
        date: this.creditData.data.date.toDate(),
        details: this.creditData.data.details,
        amount: this.creditData.data.amount,
        created: this.creditData.data.created,
        modify: this.creditData.data.modify,
        isCashback: this.creditData.data.isCashback,
        remark: this.creditData.data.remark,
      });
    }
  }

  get isAmountValid(): any {
    const control = this.creditForm.get('amount');
    const isInValid = control?.invalid && control.touched;
    if (isInValid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid amount';
    }
  }

  closeDialog() {
    this.ref.close();
  }

  saveCredit() {
    if (this.creditForm.invalid) return;

    const credit = this.creditForm.value;

    if (credit.id) {
      this.creditService.updateCredit(credit).subscribe({
        next: () =>
          this.message.addMessage(
            'success',
            'Successfully',
            'Updated successfully.',
          ),
        error: (error: any) =>
          this.message.addMessage('error', 'Error', `${error.message}`),
      });
    } else {
      this.creditService.createCredit(credit).subscribe({
        next: () =>
          this.message.addMessage(
            'success',
            'Successfully',
            'Add Credit successfully.',
          ),
        error: (error: any) =>
          this.message.addMessage('error', 'Error', `${error.message}`),
      });
    }
    this.closeDialog();
  }

  ngOnInit() {}

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }
}
