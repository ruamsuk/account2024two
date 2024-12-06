import { ChangeDetectorRef, Component, HostListener, inject, OnDestroy, OnInit, } from '@angular/core';
import { CreditService } from '../services/credit.service';
import { MessagesService } from '../services/messages.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Credit } from '../models/credit.model';
import { SharedModule } from '../shared/shared.module';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CreditComponent } from './credit.component';
import { Table } from 'primeng/table';
import { CreditDetailComponent } from './credit-detail.component';
import { AuthService } from '../services/auth.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-credit-list',
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
          #tb
          [value]="credits"
          [rowHover]="true"
          [rows]="10"
          [loading]="loading"
          [paginator]="true"
          [globalFilterFields]="['details', 'remark']"
          [tableStyle]="{ 'min-width': '30rem' }"
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
                รายการบัตรเครดิต
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
                  (input)="tb.filterGlobal(getValue($event), 'contains')"
                />
                @if (searchValue) {
                  <span class="icons" (click)="clear(tb)">
                    <i class="pi pi-times" style="font-size: 1rem"></i>
                  </span>
                }
              </p-iconField>
            </div>
          </ng-template>
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 80px">#</th>
              <th style="min-width: 120px">
                <div class="flex align-items-center">วันที่</div>
              </th>
              <th style="min-width: 120px">
                <div class="flex align-items-center">รายการ</div>
              </th>
              <th [ngClass]="{ 'hide-on-mobile': isMobile }">
                <div class="flex align-items-center">จำนวนเงิน</div>
              </th>
              <th [ngClass]="{ 'hide-on-mobile': isMobile }">
                <div class="flex align-items-center">หมายเหตุ</div>
              </th>
              <th>
                <div class="flex align-items-center" style="min-width: 90px">
                  Action
                </div>
              </th>
              <th style="min-width: 120px">*</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-credit let-i="rowIndex">
            <tr [ngClass]="{ 'row-income': credit.isCashback }">
              <td>{{ currentPage * rowsPerPage + i + 1 }}</td>
              <td [ngClass]="{ isIncome: credit.isCashback }">
                {{ credit.date | thaiDate }}
              </td>
              <td [ngClass]="{ isIncome: credit.isCashback }">
                {{ credit.details }}
              </td>
              <td
                [ngClass]="{
                  isIncome: credit.isCashback,
                  'hide-on-mobile': isMobile,
                }"
              >
                {{ credit.amount | currency: '' : '' }}
              </td>
              <td
                [ngClass]="{
                  isIncome: credit.isCashback,
                  'hide-on-mobile': isMobile,
                }"
              >
                {{ credit.remark }}
              </td>
              <td>
                <i
                  pTooltip="รายละเอียด"
                  (click)="onDetail(credit)"
                  tooltipPosition="bottom"
                  class="pi pi-list text-blue-600"
                ></i>
                @if (admin) {
                  <i
                    pTooltip="แก้ไข"
                    (click)="showDialog(credit)"
                    tooltipPosition="bottom"
                    class="pi pi-pen-to-square text-orange-600 mx-3"
                  ></i>
                  <p-confirmPopup/>
                  <i
                    pTooltip="ลบข้อมูล"
                    (click)="conf($event, credit.id)"
                    tooltipPosition="bottom"
                    class="pi pi-trash text-red-500"
                  ></i>
                }
              </td>
              <td>
                @if (credit.isCashback) {
                  <div class="block text-left text-green-400">รายรับ</div>
                  <span
                    style="text-align: left; display: block;"
                    class="text-green-400"
                  >
                  </span>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td
                colspan="6"
                class="text-center text-orange-400 text-2xl font-bold anuphon"
              >
                ไม่พบข้อมูล
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
      <!--/ card -->
    </div>
  `,
  styles: ``,
  providers: [ConfirmationService],
})
export class CreditListComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  creditService = inject(CreditService);
  message = inject(MessagesService);
  confirmService = inject(ConfirmationService);

  dialogService = inject(DialogService);
  ref: DynamicDialogRef | undefined;
  searchValue = new FormControl();

  currentPage = 0;
  rowsPerPage = 10;

  credits!: Credit[];
  loading = false;
  admin!: boolean;
  isMobile: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {
    this.getCredits();
    this.getRole();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit() {
    this.isMobile = window.innerWidth < 768;
  }

  getCredits() {
    this.loading = true;

    this.creditService
      .loadCredits()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.credits = data;
          this.loading = false;
        },
        error: (error: any) => {
          this.loading = false;
          this.message.addMessage('error', 'Error', error.message);
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

  getRole() {
    this.authService.isAdmin().then((isAdmin) => {
      this.admin = isAdmin;
    });
  }

  showDialog(credit: string) {
    let header: string;
    if (credit) {
      header = 'แก้ไขรายการ';
    } else {
      header = 'เพิ่มรายการ';
    }
    this.ref = this.dialogService.open(CreditComponent, {
      data: credit,
      header: header,
      width: '360px',
      contentStyle: {overflow: 'auto'},
      breakpoints: {
        '960px': '360px',
        '640px': '360px',
        '390px': '360px',
      },
    });
  }

  onDetail(credit: any) {
    this.ref = this.dialogService.open(CreditDetailComponent, {
      data: credit,
      header: 'รายละเอียดเครดิต',
      width: '360px',
      contentStyle: {overflow: 'auto'},
      breakpoints: {
        '960px': '360px',
        '640px': '360px',
        '390px': '360px',
      },
    });
  }

  conf(event: Event, id: string) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: 'ต้องการลบรายการนี้?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      accept: () => {
        this.creditService.deleteCredit(id).subscribe({
          next: () => this.message.addMessage('info', 'Alert', 'ลบรายการแล้ว!'),
          error: (error: any) =>
            this.message.addMessage('error', 'Error', `${error.message}`),
        });
      },
      reject: () => {
        this.message.addMessage('warn', 'Warning', 'ยกเลิกการลบ.');
      },
    });
  }

  clear(table: Table) {
    table.clear();
    this.searchValue.reset();
  }

  ngOnDestroy(): void {
    if (this.ref) this.ref.destroy();
  }
}
