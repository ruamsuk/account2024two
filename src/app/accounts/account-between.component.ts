import { Component, inject } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { AccountService } from '../services/account.service';
import { MessagesService } from '../services/messages.service';
import { Account } from '../models/account.model';
import { FormControl } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { combineLatest, take } from 'rxjs';
import { AccountsComponent } from './accounts.component';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';

@Component({
  selector: 'app-account-between',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (loading) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading" />
      </div>
    }
    <div class="card flex flex-wrap p-fluid">
      <p-card class="w-20rem xl:w-20rem mt-2 mx-auto">
        <div class="text-center tasadith text-base -mt-3 mb-2 md:text-2xl">
          <span>ตามช่วงเวลา</span>
        </div>
        <div class="flex-auto px-3">
          <p-calendar
            [iconDisplay]="'input'"
            [showIcon]="true"
            [formControl]="selectedDates"
            selectionMode="range"
            inputId="icondisplay"
            name="date"
            appendTo="body"
            placeholder="วันเริ่มต้น - วันสิ้นสุด"
            (onSelect)="onSelect()"
            [readonlyInput]="true"
            dateFormat="d M yy"
          ></p-calendar>
        </div>
      </p-card>
    </div>
    @if (accountExp) {
      <div class="flex justify-content-around align-items-center mt-3">
        <p-table
          [value]="accountExp"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '50rem' }"
          [scrollable]="true"
          scrollHeight="300px"
          styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="caption">
            <div class="flex justify-content-around tasadith md:text-xl">
              <span class="text-yellow-300">
                รายจ่าย <span class="mx-3"> ยอดคงเหลือ: </span>
              </span>
              <span class="text-red-300 tasadith text-xl">
                {{ calculateBalance() | currency: '' : '' }} </span
              ><span class="text-yellow-300">บาท</span>
            </div>
          </ng-template>
          <ng-template pTemplate="header" let-columns>
            <tr>
              <th>#</th>
              <th>วันที่</th>
              <th>รายการ</th>
              <th>จำนวนเงิน</th>
              <th>หมายเหตุ</th>
              <th>Action</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-account let-rowIndex="rowIndex">
            <tr>
              <td>{{ rowIndex + 1 }}</td>
              <td>{{ account.date | thaiDate }}</td>
              <td>{{ account.details }}</td>
              <td>{{ account.amount | currency: '' : '' }}</td>
              <td>{{ account.remark }}</td>
              <td>
                @if (admin) {
                  <i
                    pTooltip="แก้ไข"
                    (click)="showDialog(account)"
                    tooltipPosition="bottom"
                    class="pi pi-pen-to-square mr-2 ml-2 text-orange-600"
                  ></i>
                  <p-confirmPopup />
                  <i
                    pTooltip="ลบข้อมูล"
                    (click)="conf_($event, account.id)"
                    tooltipPosition="bottom"
                    class="pi pi-trash text-red-500"
                  ></i>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td
                colspan="6"
                class="text-center text-orange-400 text-xl font-bold sarabun"
              >
                ไม่พบข้อมูลรายจ่าย
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="summary">
            <div class="flex align-items-center justify-content-around">
              <span class="text-green-400 sarabun font-bold ">
                รวม: {{ accountExp ? accountExp.length : 0 }} รายการ.
              </span>
              <span class="text-orange-500 sarabun font-bold ">
                เป็นเงิน: {{ totalExpenses | currency: '' : '' }} บาท
              </span>
            </div>
          </ng-template>
        </p-table>
      </div>
    }
    @if (accountIncome) {
      <div class="flex justify-content-around align-items-center mt-3">
        <p-table
          [value]="accountIncome"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '50rem' }"
          [scrollable]="true"
          scrollHeight="300px"
          styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="caption">
            <div class="flex align-items-center justify-content-between">
              <span class="text-orange-400 font-bold text-2xl tasadith"
                >รายรับ</span
              >
              <p-button icon="pi pi-refresh" />
            </div>
          </ng-template>
          <ng-template pTemplate="header" let-columns>
            <tr>
              <th>#</th>
              <th>วันที่</th>
              <th>รายการ</th>
              <th>จำนวนเงิน</th>
              <th>หมายเหตุ</th>
              <th>Action</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-accountIn let-rowIndex="rowIndex">
            <tr>
              <td>{{ rowIndex + 1 }}</td>
              <td>{{ accountIn.date | thaiDate }}</td>
              <td>{{ accountIn.details }}</td>
              <td>{{ accountIn.amount | currency: '' : '' }}</td>
              <td>{{ accountIn.remark }}</td>
              <td>
                @if (admin) {
                  <i
                    pTooltip="แก้ไข"
                    (click)="showDialog(accountIn)"
                    tooltipPosition="bottom"
                    class="pi pi-pen-to-square mr-2 ml-2 text-orange-600"
                  ></i>
                  <p-confirmPopup />
                  <i
                    pTooltip="ลบข้อมูล"
                    (click)="conf_($event, accountIn.id)"
                    tooltipPosition="bottom"
                    class="pi pi-trash text-red-500"
                  ></i>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td
                colspan="6"
                class="text-center text-orange-400 text-xl font-bold sarabun"
              >
                ไม่พบข้อมูลรายรับ
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="summary">
            <div class="flex align-items-center justify-content-around">
              <span class="text-green-400 sarabun font-bold ">
                รวม: {{ accountIncome ? accountIncome.length : 0 }} รายการ.
              </span>
              <span class="text-orange-500 sarabun font-bold ">
                เป็นเงิน: {{ totalIncome | currency: '' : '' }} บาท
              </span>
            </div>
          </ng-template>
        </p-table>
      </div>
    }
  `,
  styles: ``,
})
export class AccountBetweenComponent {
  dialogService = inject(DialogService);
  message = inject(MessagesService);
  accountService = inject(AccountService);
  authService = inject(AuthService);
  confirmService = inject(ConfirmationService);

  selectedDates = new FormControl();
  loading: boolean = false;
  totalIncome: number = 0;
  totalExpenses: number = 0;
  accountIncome!: Account[];
  accountExp!: Account[];
  ref: DynamicDialogRef | undefined;

  admin: boolean = false;

  constructor() {
    this.checkRole();
  }

  checkRole() {
    this.authService.isAdmin().then((isAdmin) => {
      this.admin = isAdmin;
    });
  }

  /** Selected date range */
  onSelect() {
    const selectedDates = this.selectedDates.value;
    if (
      selectedDates &&
      selectedDates.length === 2 &&
      selectedDates[0] &&
      selectedDates[1]
    ) {
      const start = selectedDates[0];
      const end = selectedDates[1];
      const starter = new Date(start);
      const ender = new Date(end);

      /** avoid same date or end less than begin */
      if (starter >= ender) {
        this.message.addMessage(
          'error',
          'Error',
          'วันเริ่มต้นกับวันสิ้นสุดต้องคนละวันกัน',
        );
        return;
      }

      this.loading = true;

      /** combine search expenses and incomes */
      combineLatest<any>([
        this.accountService
          .searchDateTransactions(start, end, false)
          .pipe(take(1)),
        this.accountService
          .searchDateTransactions(start, end, true)
          .pipe(take(1)),
      ]).subscribe({
        next: ([expenses, incomes]: [Account[], Account[]]) => {
          this.accountExp = expenses;
          this.accountIncome = incomes;

          /** Calculate total expenses and total income */
          this.totalExpenses = expenses.reduce(
            (sum: any, expense: { amount: any }) => sum + expense.amount,
            0,
          );
          this.totalIncome = incomes.reduce(
            (sum: any, income: { amount: any }) => sum + income.amount,
            0,
          );
        },
        error: (error: any) => {
          this.message.addMessage('error', 'Error', error.message);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      } as any);

      this.loading = false;
    } else {
      console.log('Please select a valid date range.');
    }
  }

  calculateBalance(): number {
    const totalIncome: number = this.totalIncome || 0;
    const totalExpenses: number = this.totalExpenses || 0;
    return totalIncome - totalExpenses;
  }

  /**
   * delete
   * */
  conf_(event: Event, id: string) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: 'ต้องการลบรายการนี้?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-warning p-button-sm',
      accept: () => {
        this.accountService.deleteAccount(id).subscribe({
          next: () =>
            this.message.addMessage('warning', 'Warning', 'ลบรายการแล้ว!'),
          error: (error: any) =>
            this.message.addMessage('error', 'Error', `${error.message}`),
        });
      },
      reject: () => {
        this.message.addMessage('info', 'Cancel Delete', 'ยกเลิกการลบ.');
      },
    });
  }

  showDialog(account: any) {
    let header = account ? 'แก้ไขรายการ' : 'เพิ่มรายการ';

    this.ref = this.dialogService.open(AccountsComponent, {
      data: account,
      header: header,
      width: '360px',
      contentStyle: { overflow: 'auto' },
      breakpoints: {
        '960px': '360px',
        '640px': '360px',
        '390px': '360px',
      },
    });
    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.onSelect();
      }
    });
  }
}
