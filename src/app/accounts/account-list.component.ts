import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnInit,
} from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { MessagesService } from '../services/messages.service';
import { AccountService } from '../services/account.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Account } from '../models/account.model';
import { SharedModule } from '../shared/shared.module';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { Table } from 'primeng/table';
import { AccountsComponent } from './accounts.component';
import { AccountDetailComponent } from './account-detail.component';
import { FormControl } from '@angular/forms';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    <div class="table-container align-items-center justify-content-center mt-3">
      @if (loading) {
        <div class="loading-shade">
          <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
        </div>
      }

      <div class="card">
        <p-table
                #dt
                [value]="accounts"
                [rowHover]="true"
                [rows]="10"
                [loading]="loading"
                [paginator]="true"
                [globalFilterFields]="['details', 'remark']"
                [tableStyle]="{ 'min-width': '40rem' }"
        >
          <ng-template pTemplate="caption">
            <div class="flex align-items-center justify-content-between">
              <span>
                <p-button
                        (click)="showDialog('')"
                        [disabled]="!admin"
                        size="small"
                        icon="pi pi-plus"
                />
              </span>
              <span
                      class="hidden md:block tasadith text-green-400 text-3xl ml-auto"
              >
                รายการค่าใช้จ่าย
              </span>
              <p-iconField iconPosition="left" class="ml-auto">
                <p-inputIcon>
                  <i class="pi pi-search"></i>
                </p-inputIcon>
                <input
                        class="sarabun"
                        pInputText
                        [formControl]="searchValue"
                        pTooltip="หารายการ หรือหมายเหตุ"
                        tooltipPosition="bottom"
                        placeholder="ค้นหา .."
                        type="text"
                        (input)="dt.filterGlobal(getValue($event), 'contains')"
                />
                @if (searchValue.value) {
                  <span class="icons" (click)="clear(dt)">
                    <i class="pi pi-times" style="font-size: 1rem"></i>
                  </span>
                }
              </p-iconField>
            </div>
          </ng-template>
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 80px; margin-left: 5px;">#</th>
              <th style="min-width: 150px">
                <div class="flex align-items-center sm:ml-0">วันที่</div>
              </th>
              <th style="min-width: 150px">
                <div class="flex align-items-center">รายการ</div>
              </th>
              <th [ngClass]="{ 'hide-on-mobile': isMobile }">
                <div class="flex align-items-center">จำนวนเงิน</div>
              </th>
              <th [ngClass]="{ 'hide-on-mobile': isMobile }">
                <div class="flex align-items-center">หมายเหตุ</div>
              </th>
              <th style="min-width: 120px">
                <div class="flex align-items-center">Action</div>
              </th>
              <th style="min-width: 100px">*</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-account let-i="rowIndex">
            <tr [ngClass]="{ 'row-income': account.isInCome }">
              <td>{{ currentPage * rowsPerPage + i + 1 }}</td>
              <td [ngClass]="{ isIncome: account.isInCome }">
                {{ account.date | thaiDate }}
              </td>
              <td [ngClass]="{ isIncome: account.isInCome }">
                {{ account.details }}
              </td>
              <td
                      [ngClass]="{
                  isIncome: account.isInCome,
                  'hide-on-mobile': isMobile,
                }"
              >
                {{ account.amount | currency: '' : '' }}
              </td>
              <td
                      [ngClass]="{
                  isIncome: account.isInCome,
                  'hide-on-mobile': isMobile,
                }"
              >
                {{ account.remark }}
              </td>
              <td>
                <i
                        pTooltip="รายละเอียด"
                        (click)="onDetail(account)"
                        tooltipPosition="bottom"
                        class="pi pi-list text-blue-600"
                ></i>
                @if (admin) {
                  <i
                          pTooltip="แก้ไข"
                          (click)="showDialog(account)"
                          tooltipPosition="bottom"
                          class="pi pi-pen-to-square mx-3 text-orange-600"
                  ></i>
                  <p-confirmPopup/>
                  <i
                          pTooltip="ลบข้อมูล"
                          (click)="conf($event, account.id)"
                          tooltipPosition="bottom"
                          class="pi pi-trash text-red-500"
                  ></i>
                }
              </td>
              <td>
                @if (account.isInCome) {
                  <span class="flex justify-content-start ml-2 text-green-400"
                  >รายรับ</span
                  >
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
	`,
  styles: ``,
})
export class AccountListComponent implements OnInit {
  accountService = inject(AccountService);
  authService = inject(AuthService);
  confirmService = inject(ConfirmationService);
  dialogService = inject(DialogService);
  message = inject(MessagesService);

  currentPage = 0;
  rowsPerPage = 10;

  admin: boolean = false;
  isMobile: boolean = false;
  loading = false;
  accounts!: Account[];
  account!: Account;
  ref: DynamicDialogRef | undefined;
  searchValue = new FormControl('');

  constructor(private cdr: ChangeDetectorRef) {
    this.getRole();
    this.getAccounts();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit() {
    this.isMobile = window.innerWidth < 768;
  }

  getRole() {
    this.authService.isAdmin().then((isAdmin) => {
      this.admin = isAdmin;
    });
  }

  getAccounts() {
    this.loading = true;

    this.accountService
      .loadAccounts()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data: Account[]) => {
          this.accounts = data;
          this.loading = false;
        },
        error: (error: any) => {
          this.message.addMessage('error', 'Error', error.message);
          this.loading = false;
        },
        complete: () => {
          setTimeout(() => {
            this.loading = false;
            this.cdr.detectChanges();
          }, 100);
        },
      });
  }

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /**
   * ลบรายการ โดยยืนยันก่อนลบ
   * */
  conf(event: Event, id: string) {
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
        this.message.addMessage('info', 'Information', 'ยกเลิกการลบ.');
      },
    });
  }

  /**
   * ลบข้อความในช่องค้นหา
   * */
  clear(table: Table) {
    table.clear();
    this.searchValue.setValue('');
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
  }

  onDetail(account: any) {
    this.dialogService.open(AccountDetailComponent, {
      data: account,
      header: 'รายละเอียดบัญชี',
      width: '360px',
      contentStyle: { overflow: 'auto' },
      breakpoints: {
        '960px': '360px',
        '640px': '360px',
        '390px': '360px',
      },
    });
  }
}
