import { Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { MonthlyService } from '../services/monthly.service';
import { MessagesService } from '../services/messages.service';
import { SelectorService } from '../services/selector.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Table } from 'primeng/table';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CrudMonthlyComponent } from './crud-monthly/crud-monthly.component';
import { ConfirmationService } from 'primeng/api';
import { Monthly } from '../models/monthly.model';
import { AuthService } from '../services/auth.service';
import { ChristianToThaiYearPipe } from '../pipe/christian-to-thai-year.pipe';

@Component({
  selector: 'app-monthly',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe, ChristianToThaiYearPipe],
  template: `
    <div class="card">
      @if (loading) {
        <div class="loading-shade">
          <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
        </div>
      }
      <div class="flex justify-content-center align-items-center">
        <div class="mt-2">
          <div
            class="flex align-items-center justify-content-center bg-black-alpha-10 shadow-3"
          >
            <span
              class="tasadith text-blue-600 font-bold md:text-3xl xl:text-2xl line-height-4"
            >
              กำหนดวันเริ่มและสิ้นสุดของเดือน
            </span>
          </div>
          <p-table
            #tb
            [value]="monthly"
            [rows]="10"
            [rowsPerPageOptions]="[5, 10, 20, 30]"
            [paginator]="true"
            [globalFilterFields]="['details', 'remark']"
            [scrollable]="true"
            scrollHeight="800px"
            [tableStyle]="{ 'min-width': '40rem' }"
            styleClass="p-datatable-striped z-0"
          >
            <ng-template pTemplate="caption">
              <div class="flex align-items-center justify-content-between">
                <span>
                  <p-button
                    (click)="showDialog(Monthly)"
                    [disabled]="!admin"
                    size="small"
                    icon="pi pi-plus"
                  />
                </span>
                <p-iconField iconPosition="left" class="ml-auto">
                  <p-inputIcon>
                    <i class="pi pi-search"></i>
                  </p-inputIcon>
                  <input
                    class="sarabun"
                    pInputText
                    [(ngModel)]="searchValue"
                    pTooltip="หาเดือน"
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
                <th pSortableColumn="month">
                  <div class="flex align-items-center sm:ml-0">
                    เดือน
                    <p-sortIcon field="เดือน"/>
                  </div>
                </th>
                <th pSortableColumn="year">
                  <div class="flex align-items-center sm:ml-0">
                    ปี
                    <p-sortIcon field="ปี"/>
                  </div>
                </th>
                <th>
                  <div class="flex align-items-center">วันเริ่มต้น</div>
                </th>
                <th>
                  <div class="flex align-items-center">วันสิ้นสุด</div>
                </th>
                <th>
                  <div class="flex align-items-center">Action</div>
                </th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-month>
              <tr>
                <td>{{ month.month }}</td>
                <td>{{ month.year | christianToThaiYear }}</td>
                <td>{{ month.datestart | thaiDate }}</td>
                <td>{{ month.dateend | thaiDate }}</td>
                <td>
                  @if (admin) {
                    <i
                      pTooltip="แก้ไข"
                      (click)="showDialog(month)"
                      tooltipPosition="bottom"
                      class="pi pi-pen-to-square mr-2 ml-2 text-orange-600"
                    ></i>
                    <p-confirmPopup/>
                    <i
                      pTooltip="ลบข้อมูล"
                      (click)="conf($event, month.id)"
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
                  class="text-center text-orange-400 text-2xl font-bold anuphon"
                >
                  ไม่พบข้อมูล
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
  `,
  styles: `
    th {
      color: darkcyan !important;
      font-size: 18px;
      font-weight: bold !important;
    }

    th,
    td {
      /*   background-color: #eceaea;
         margin-left: 1rem !important;*/
      font-family: 'Sarabun', sans-serif !important;
    }

    :host ::ng-deep input {
      font-family: 'Sarabun', sans-serif !important;
    }

    i.pi {
      &:hover {
        cursor: pointer;
      }
    }

    .icons {
      position: relative;
      right: 30px;
      //top: 10px;
    }
  `,
})
export class MonthlyComponent implements OnDestroy {
  searchValue: string = '';
  year: any[] = [];
  loading: boolean = false;
  admin!: boolean;
  monthly: any[] = [];
  dialogService = inject(DialogService);
  ref: DynamicDialogRef | undefined;
  Monthly!: Monthly;
  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private yearSearch: SelectorService,
    private monthlyService: MonthlyService,
    private messageService: MessagesService,
    private confirmService: ConfirmationService,
  ) {
    this.yearSearch.getYear().then((year) => {
      this.year = year;
    });
    this.getRole();
    this.getMonthly();
  }

  getMonthly() {
    this.loading = true;
    this.monthlyService
      .getSortedMonthlyData()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: any) => {
          this.messageService.addMessage('error', 'Error', err.message);
          console.error(err);
          return of([]);
        }),
      )
      .subscribe((result: any[]) => {
        this.loading = false;
        this.monthly = result;
      });
  }

  getRole() {
    this.authService.isAdmin().then((isAdmin) => {
      this.admin = isAdmin;
    });
  }

  showDialog(monthly: Monthly) {
    let header: string;
    if (monthly) {
      header = 'แก้ไขรายการ: ' + monthly.month;
    } else {
      header = 'เพิ่มรายการ';
    }
    this.ref = this.dialogService.open(CrudMonthlyComponent, {
      data: monthly,
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

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  conf(event: Event, id: string) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: 'ต้องการลบรายการนี้?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-warning p-button-sm',
      accept: () => {
        this.monthlyService.deleteMonth(id).subscribe({
          next: () =>
            this.messageService.addMessage('info', 'Info', 'ลบรายการแล้ว!'),
          error: (error: any) =>
            this.messageService.addMessage(
              'error',
              'Error',
              `${error.message}`,
            ),
        });
      },
      reject: () => {
        this.messageService.addMessage(
          'success',
          'Successfully',
          'ยกเลิกการลบ.',
        );
      },
    });
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }
}
