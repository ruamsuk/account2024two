import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessagesService } from '../../services/messages.service';
import { MonthlyService } from '../../services/monthly.service';
import { Monthly } from '../../models/monthly.model';
import { SharedModule } from '../../shared/shared.module';
import { SelectorService } from '../../services/selector.service';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-crud-monthly',
  standalone: true,
  imports: [SharedModule],
  template: `
    <hr class="h-px bg-gray-200 border-0" />
    <form [formGroup]="monthlyForm" (ngSubmit)="saveMonthly($event)">
      <input type="hidden" />
      <div class="field">
        <label for="treeSelect" class="ml-2">เดือน</label>
        <p-treeSelect
          class=""
          containerStyleClass="w-full"
          formControlName="month"
          [options]="_month"
          appendTo="body"
          placeholder="เลิอกเดือน"
        />
      </div>
      <div class="field">
        <label for="date">วันเริ่มต้น</label>
        <p-calendar
          [iconDisplay]="'input'"
          [showIcon]="true"
          [inputStyle]="{ width: '90vw' }"
          appendTo="body"
          inputId="icondisplay"
          formControlName="datestart"
          name="datestart"
          dateFormat="d M yy"
          class="w-full"
        />
      </div>
      <div class="field">
        <label for="date">วันสิ้นสุด</label>
        <p-calendar
          [iconDisplay]="'input'"
          [showIcon]="true"
          [inputStyle]="{ width: '90vw' }"
          appendTo="body"
          inputId="icondisplay"
          formControlName="dateend"
          name="dateend"
          dateFormat="d M yy"
          class="w-full"
        />
      </div>
      <div class="field">
        <hr class="h-px bg-gray-200 border-0 mb-1" />
        <div class="flex mt-2 mb-1">
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="w-full"
            class="w-full mr-2"
            (onClick)="close()"
          />
          <p-button
            label="Save"
            [disabled]="monthlyForm.invalid"
            styleClass="w-full"
            class="w-full"
            (onClick)="saveMonthly($event)"
          />
        </div>
      </div>
      <p-confirmPopup />
    </form>
  `,
  styles: `
    label {
      font-family: Sarabun, sans-serif !important;
    }
  `,
})
export class CrudMonthlyComponent implements OnInit, OnDestroy {
  monthly!: Monthly;
  _month: any[] = [];
  year: any[] = [];
  monthlyForm = new FormGroup({
    id: new FormControl(null),
    month: new FormControl({
      label: 'มกราคม',
      parent: undefined,
    } as unknown as Monthly),
    datestart: new FormControl('', Validators.required),
    dateend: new FormControl('', Validators.required),
  });

  constructor(
    private ref: DynamicDialogRef,
    private confirmService: ConfirmationService,
    private monthlyData: DynamicDialogConfig,
    private message: MessagesService,
    private monthlyService: MonthlyService,
    private selectService: SelectorService,
  ) {
    if (this.monthlyData.data) {
      this.monthlyForm.patchValue({
        id: this.monthlyData.data.id,
        month: this.monthlyData.data.month.label,
        datestart: this.monthlyData.data.datestart.toDate(),
        dateend: this.monthlyData.data.dateend.toDate(),
      });
    }
    this.selectService.getMonth().then((month) => {
      this._month = month;
    });
  }

  ngOnInit() {}

  saveMonthly(event: Event) {
    if (this.monthlyForm.invalid) return;

    const monthly = this.monthlyForm.value;

    if (monthly.id) {
      if (monthly.month == null) {
        console.log('monthly.month null');
        this.confirmService.confirm({
          target: event.target as EventTarget,
          message: 'ต้องเลือกเดือนอีกตรั้งก่อน!',
          icon: 'pi pi-exclamation-circle',
          acceptLabel: 'OK',
          acceptButtonStyleClass: 'p-button-sm',
          rejectVisible: false,
          accept: () => {
            return;
          },
        });
      } else {
        this.monthlyService.updateMonthly(monthly).subscribe({
          next: () =>
            this.message.addMessage(
              'success',
              'Successfully',
              'Updated monthly',
            ),
          error: (err) =>
            this.message.addMessage('error', 'Error', err.message),
          complete: () => this.close(),
        });
      }
    } else {
      this.monthlyService.addMonthly(monthly).subscribe({
        next: () =>
          this.message.addMessage('success', 'Successfully', 'Saved monthly.'),
        error: (err) => this.message.addMessage('error', 'Error', err.message),
        complete: () => this.close(),
      });
    }
  }

  close() {
    this.ref.destroy();
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }
}
