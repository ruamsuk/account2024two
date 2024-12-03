import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { ConfirmationService } from 'primeng/api';
import { MessagesService } from '../services/messages.service';
import {
  combineLatest,
  finalize,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { SelectorService } from '../services/selector.service';
import { CreditService } from '../services/credit.service';
import { MonthSummary } from '../models/credit.model';
import { MonthConversionService } from '../services/month-conversion.service';
import { CreditComponent } from './credit.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-credit-between',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ThaiDatePipe,
  ],
  template: `
    <div class="flex justify-content-around align-items-center h-15rem">
      <p-card>
        <p
          class="hidden flex justify-content-center text-gray-200 tasadith text-2xl -mt-4 "
        >
          รายการบัตรเครดิตตามช่วงเวลา
        </p>

        <div class="flex justify-content-center flex-wrap xs:flex-column gap-4">
          <div class="flex align-items-center justify-content-center w-19rem">
            <p-floatLabel class="md:w-20rem w-full">
              <p-treeSelect
                containerStyleClass="w-full"
                [formControl]="selectMonth"
                [options]="month"
                (onNodeSelect)="searchM()"
                placeholder="เลิอกเดือน"
              />
              <label for="treeSelect">เลือกเดือน</label>
            </p-floatLabel>
          </div>
          <div class="flex align-items-center justify-content-center w-19rem">
            <p-floatLabel class="md:w-20rem w-full">
              <p-treeSelect
                containerStyleClass="w-full"
                [formControl]="selectYear"
                [options]="year"
                (onNodeSelect)="search()"
                placeholder="เลิอกปี"
              />
              <label for="treeSelect">เลือกปี</label>
            </p-floatLabel>
          </div>
        </div>
      </p-card>
    </div>

    @if (creditSummary$ | async; as creditSummary) {
      @if (creditSummary.transactions.length > 0) {
        <div
          class="table-container align-items-center justify-content-center -mt-2"
        >
          @if (loading) {
            <div class="loading-shade">
              <p-progressSpinner strokeWidth="4" ariaLabel="loading" />
            </div>
          }
          <div class="card">
            <p-table
              #tb
              [value]="creditSummary.transactions"
              [columns]="cols"
              [paginator]="true"
              [rows]="8"
              [rowHover]="true"
              [style]="{ 'min-width': '40rem' }"
              styleClass="p-datatable-striped"
              responsiveLayout="scroll"
            >
              <ng-template pTemplate="caption">
                <div class="flex justify-content-between">
                  <span class="text-orange-400 font-bold text-2xl tasadith">
                    ค่าใช้จ่ายเดือน:
                    <span class="ml-2 text-green-400 text-xl">
                      {{ searchMonth }} : {{ searchYear }}
                    </span>
                  </span>
                  <p-button icon="pi pi-plus" (onClick)="showDialog('')" />
                </div>
              </ng-template>
              <ng-template pTemplate="header">
                <tr>
                  @for (col of cols; track col.field) {
                    @if (col.field === 'date') {
                      <th pSortableColumn="{{ col.field }}">
                        {{ col.header }}
                        <p-sortIcon field="{{ col.field }}"></p-sortIcon>
                      </th>
                    } @else if (col.field === 'expense') {
                      <th>จำนวนเงิน</th>
                    } @else {
                      <th>{{ col.header }}</th>
                    }
                  }
                  <th>Action</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-credit let-i="rowIndex">
                <tr [ngClass]="{ 'row-income': credit.isCashback }">
                  <td
                    [ngClass]="{
                      isIncome: credit.isCashback,
                      'custom-padding': true,
                    }"
                  >
                    {{ currentPage * rowsPerPage + i + 1 }}
                  </td>
                  <td [ngClass]="{ isIncome: credit.isCashback }">
                    {{ credit.date | thaiDate }}
                  </td>
                  <td [ngClass]="{ isIncome: credit.isCashback }">
                    {{ credit.details }}
                  </td>
                  <td [ngClass]="{ isIncome: credit.isCashback }">
                    {{ credit.amount | currency: '' : '' }}
                  </td>
                  <td [ngClass]="{ isIncome: credit.isCashback }">
                    {{ credit.remark }}
                  </td>
                  <td>
                    @if (admin) {
                      <i
                        pTooltip="แก้ไข"
                        (click)="showDialog(credit)"
                        tooltipPosition="bottom"
                        class="pi pi-pen-to-square mx-3 text-blue-400"
                      ></i>
                      <p-confirmPopup />
                      <i
                        pTooltip="ลบข้อมูล"
                        (click)="conf($event, credit.id)"
                        tooltipPosition="bottom"
                        class="pi pi-trash text-red-500"
                      ></i>
                    }
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="footer">
                <tr>
                  <td>
                    <span class="tasadith text-xl">รายจ่าย</span>
                  </td>
                  <td>
                    <div class="ml-3 text-red-300">
                      {{
                        isDataAvailable(creditSummary)
                          | currency: '' : '' : '1.2-2'
                      }}
                    </div>
                  </td>
                  <td>
                    <span class="text-green-400 tasadith text-xl">เงินคืน</span>
                  </td>
                  <td>
                    <span class="text-orange-300">
                      {{ creditSummary.cashback | currency: '' : '' : '1.2-2' }}
                    </span>
                  </td>
                  <td><span class="tasadith text-xl">บาท</span></td>
                  <td></td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      }
    }
  `,
  styles: `
    .custom-padding {
      padding-left: 25px;
    }

    .isIncome {
      color: #0af225 !important;
      font-weight: 500 !important;
    }

    .row-income {
      background-color: rgba(227, 248, 219, 0.05) !important;
    }
  `,
})
export class CreditBetweenComponent implements OnDestroy, OnInit {
  selectMonth = new FormControl();
  selectYear = new FormControl();
  creditSummary$: Observable<MonthSummary> = of({
    expense: 0,
    cashback: 0,
    transactions: [],
  });

  loading: boolean = false;

  message = inject(MessagesService);
  selectService = inject(SelectorService);
  creditService = inject(CreditService);
  ref: DynamicDialogRef | undefined;

  admin!: boolean;
  month: any;
  year: any;
  searchMonth: string = '';
  searchYear: string = '';
  currentPage = 0;
  rowsPerPage = 10;

  cols: any[] = [
    { field: 'index', header: 'ลำดับ' },
    { field: 'date', header: 'วัน' },
    { field: 'details', header: 'รายการ' },
    { field: 'expense', header: 'รายจ่าย', pipe: 'currency' },
    { field: 'remark', header: 'หมายเหตุ' },
  ];

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private monthConversionService: MonthConversionService,
    private dialogService: DialogService,
    private confirmService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.getRole();
    this.monthSearch();
    this.yearSearch();
  }

  getRole() {
    this.authService.isAdmin().then((isAdmin) => {
      this.admin = isAdmin;
    });
  }

  ngOnDestroy() {}

  search() {
    // updated
    const christianYear = this.convertToChristianYear(
      this.selectYear.value.label,
    );
    const monthNumber = this.monthConversionService.thaiMonthToNumber(
      this.selectMonth.value.label,
    );

    this.searchMonth = this.selectMonth.value.label;
    this.searchYear = this.selectYear.value.label;

    if (monthNumber === undefined) {
      console.error('Invalid month name:', this.selectMonth.value.label);
      return of({ expense: 0, cashback: 0, transactions: [] });
    }

    this.creditSummary$ = combineLatest([
      this.selectMonth.valueChanges.pipe(
        startWith(this.selectMonth.value.label),
      ),
      this.selectYear.valueChanges.pipe(startWith(christianYear)),
    ]).pipe(
      switchMap(([month, year]) => {
        const adjustedMonthAndYear = this.adjustMonthAndYearForJanuary(
          monthNumber,
          year,
        );

        return this.creditService.getCreditSummary(
          adjustedMonthAndYear.month,
          adjustedMonthAndYear.year,
        );
      }),
      finalize(() => {
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }, 100);
      }),
    );
    return;
  }

  searchM() {
    // console.log('changeM', this.labelMonth.label);
  }

  /**
   *
   * @param summary
   */
  isDataAvailable(summary: MonthSummary) {
    return summary.expense - summary.cashback;
  }

  clearInput() {
    this.selectYear.reset();
    this.selectMonth.reset();
  }

  showDialog(credit: any) {
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
      contentStyle: { overflow: 'auto' },
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
          next: () =>
            this.message.addMessage('warn', 'Warning', 'ลบรายการแล้ว!'),
          error: (error: any) =>
            this.message.addMessage('error', 'Error', `${error.message}`),
        });
      },
      reject: () => {
        this.message.addMessage('info', 'Warning', 'ยกเลิกการลบ.');
      },
    });
  }

  private monthSearch() {
    this.selectService.getMonth().then((data) => {
      this.month = data;
    });
  }

  private yearSearch() {
    this.selectService.getYear().then((data) => {
      this.year = data;
    });
  }

  private convertToChristianYear(thaiYearLabel: string): number {
    return Number(thaiYearLabel) - 543;
  }

  private adjustMonthAndYearForJanuary(
    month: number,
    year: number,
  ): { month: number; year: number } {
    if (month === 1) {
      return { month: 12, year: year - 1 };
    } else {
      return { month: month - 1, year };
    }
  }
}
