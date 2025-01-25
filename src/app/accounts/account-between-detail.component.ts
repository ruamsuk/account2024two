import { Component, inject } from '@angular/core';
import {
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { AccountService } from '../services/account.service';
import { MessagesService } from '../services/messages.service';
import { FormControl } from '@angular/forms';
import { Account } from '../models/account.model';
import { AuthService } from '../services/auth.service';
import { SharedModule } from '../shared/shared.module';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AccountsComponent } from './accounts.component';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';

@Component({
  selector: 'app-account-between-detail',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (loading) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div
            class="flex flex-wrap p-fluid justify-content-center align-items-center mt-2"
    >
      <p-card>
        <div class="text-center tasadith text-base md:text-2xl -mt-3 mb-2">
          <span>รายการตามช่วงเวลาและรายการ</span>
        </div>
        <div class="flex-grow-1 flex align-items-center justify-content-center">
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
          <div
                  class="flex-grow-1 flex align-items-center justify-content-center"
          >
            <p-iconField iconPosition="right">
              <p-inputIcon
                      styleClass="pi pi-book cursor-pointer"
                      (click)="resetAll()"
              />
              <input
                      type="text"
                      pInputText
                      name="detail"
                      [formControl]="searchDetail"
              />
            </p-iconField>
          </div>
        </div>
      </p-card>
    </div>
    @if (account) {
      <div class="flex justify-content-around align-items-center mt-3">
        <p-table
                [value]="account"
                [scrollable]="true"
                [rowHover]="true"
                scrollHeight="400px"
                [tableStyle]="{ 'min-width': '35vw' }"
                styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="caption">
            <div class="flex align-items-center justify-content-between">
              <span class="text-orange-400 font-bold text-2xl tasadith">
                รายการของ: <span class="text-green-400"> {{ title }}</span>
              </span>
              <p-button icon="pi pi-refresh"/>
            </div>
          </ng-template>
          <ng-template pTemplate="header">
            <tr>
              <th>#</th>
              <th style="min-width: 120px">
                <div>วันที่</div>
              </th>
              <th style="min-width: 120px">
                <div>จำนวนเงิน</div>
              </th>
              <th style="min-width: 150px">
                <div>หมายเหตุ</div>
              </th>
              <th style="min-width: 150px">
                <div>Action</div>
              </th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-account let-rowIndex="rowIndex">
            <tr>
              <td>{{ rowIndex + 1 }}</td>
              <td>
                {{ account.date | thaiDate }}
              </td>
              <td>
                {{ account.amount | currency: '' : '' }}
              </td>
              <td>
                {{ account.remark }}
              </td>
              <td>
                @if (admin) {
                  <i
                          pTooltip="แก้ไข"
                          (click)="showDialog(account)"
                          tooltipPosition="bottom"
                          class="pi pi-pen-to-square mx-2 text-orange-600"
                  ></i>
                  <p-confirmPopup/>
                  <i
                          pTooltip="ลบข้อมูล"
                          (click)="conf_($event, account.id)"
                          tooltipPosition="bottom"
                          class="pi pi-trash text-red-500"
                  ></i>
                }
              </td>
              <td></td>
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
            <div
                    class="flex align-items-center justify-content-around sarabun font-bold"
            >
              <span>
                รวม:
                <span class="text-orange-400 mx-3">
                  {{ account ? account.length : 0 }}
                </span>
                รายการ.
              </span>
              <span>
                เป็นเงิน:
                <span class="text-orange-400 mx-3">
                  {{ getTotal() | currency: '' : '' }}
                </span>
                บาท
              </span>
            </div>
          </ng-template>
        </p-table>
      </div>
    }
	`,
  styles: ``,
})
export class AccountBetweenDetailComponent {
  selectedDates = new FormControl();
  searchDetail = new FormControl();
  loading: boolean = false;
  totalExpenses!: Account[];
  admin!: boolean;

  authService = inject(AuthService);
  message = inject(MessagesService);
  accountService = inject(AccountService);
  confirmService = inject(ConfirmationService);

  dialogService = inject(DialogService);
  ref: DynamicDialogRef | undefined;

  account!: Account[];
  title: string = '';

  results$: Observable<any> = new Observable();

  constructor() {
    this.results$ = this.searchDetail.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap((value) => this.resultDetails(value)),
    );
    /** be sure valueChange is work! */
    this.results$.subscribe();
    this.getRole();
  }

  resultDetails(value: string): Observable<any> {
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
        return of(null);
      }

      this.loading = true;
      this.title = value;

      this.accountService
        .searchDesc(start, end, value)
        .pipe(take(1))
        .subscribe({
          next: (data: any) => {
            this.account = data;
            this.totalExpenses = data;
            this.loading = false;
          },
          error: (error: any) => {
            this.loading = false;
            this.message.addMessage('error', 'Error', error.message);
            console.log(error.message);
          },
        });
      return of(this.account);
    }
    return of(null);
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
          next: () => this.message.addMessage('info', 'Info', 'ลบรายการแล้ว!'),
          error: (error: any) =>
            this.message.addMessage('error', 'Error', `${error.message}`),
        });
      },
      reject: () => {
        this.message.addMessage('warn', 'Warning', 'ยกเลิกการลบ.');
      },
    });
  }

  getRole() {
    this.authService.isAdmin().then((isAdmin) => {
      this.admin = isAdmin;
    });
  }

  getTotal() {
    return this.totalExpenses.reduce((total, n) => total + Number(n.amount), 0);
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
        this.resultDetails(this.title);
      }
    });
  }

  resetAll(): void {
    this.searchDetail.setValue('');
    this.selectedDates.setValue('');
  }

  onSelect() {
    // nothing todos.
  }
}
