import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SharedModule } from '../shared/shared.module';
import { MessagesService } from '../services/messages.service';
import { SelectorService } from '../services/selector.service';
import { SearchYearService } from '../services/search-year.service';

@Component({
  selector: 'app-credit-year',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="flex justify-content-center align-items-center h-15rem">
      <p-card [style]="{ 'min-width': '25vw' }">
        <p
          class="tasadith text-base md:text-xl -mt-3 ml-2 text-green-400 text-center"
        >
          เครดิตรายปี
        </p>
        <p-floatLabel class="flex justify-content-center align-items-center">
          <p-treeSelect
            class="md:w-20rem"
            containerStyleClass="w-15rem"
            [formControl]="searchYear"
            [options]="year"
            (onNodeSelect)="yearSearch()"
            placeholder="เลิอกปี"
            appendTo="body"
          />
          <label for="treeSelect">เลือกปี</label>
        </p-floatLabel>
      </p-card>
    </div>
    @if (loading) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading" />
      </div>
    }
    @if (results.length != 0) {
      <div class="flex justify-content-center align-items-center -mt-4">
        <p-card [style]="{ width: '450px' }">
          <p-table
            [tableStyle]="{ width: '400px' }"
            [value]="data"
            [scrollable]="true"
            scrollHeight="400px"
            styleClass="p-datatable-striped"
          >
            <ng-template pTemplate="caption">
              <div
                class="flex align-items-center justify-content-between -mt-6"
              >
                <span
                  class="text-orange-400 font-bold text-xl md:text-2xl tasadith"
                  >ค่าใช้จ่ายในรอบปี</span
                >

                <p-button icon="pi pi-refresh" />
              </div>
            </ng-template>
            <ng-template pTemplate="header">
              <tr>
                <th>เดือน</th>
                <th>จำนวนเงิน</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-result>
              <tr>
                <td>{{ result.month }}</td>
                <td>{{ result.total | currency: '' : '' }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td
                  colspan="6"
                  class="text-center text-orange-400 text-xl font-bold sarabun"
                >
                  ไม่พบข้อมูลค่าใช้จ่าย
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="summary">
              <div
                class="flex align-items-center justify-content-around line-height-3"
              >
                <div>
                  <span class="sarabun">
                    เป็นเงิน:
                    <span class="text-yellow-300 mx-3">
                      {{ totalExpense | currency: '' : '' }}
                    </span>
                    บาท
                  </span>
                </div>
              </div>
              <hr />
              <div class="line-height-3">
                <span class="text-orange-500 font-light sarabun">
                  มากสุด:
                  {{ maxMountExpense }} {{ maxAmount | currency: '' : '' }} บาท
                </span>
              </div>
              <div class=" line-height-3">
                <span class="text-green-500 font-light sarabun">
                  น้อยสุด:
                  {{ minMonthExpense }} {{ minAmount | currency: '' : '' }} บาท
                </span>
              </div>
              <div class="line-height-3">
                <span class="text-blue-400 font-light sarabun">
                  เฉลี่ย: {{ averageAmount | currency: '' : '' }} บาท
                </span>
                <div class="line-height-3">
                  <span class="text-green-400 sarabun">
                    เงินคืน: {{ totalCashback | currency: '' : '' }} บาท
                  </span>
                </div>
                <div class="line-height-3 text-300 font-italic sarabun">
                  *เงินคืนอาจเป็นการยกเลิกรายการจ่ายก็ได้ <br />
                  *ยอดนี้ยังไม่หักเงินคืน หรือรายรับ
                </div>
              </div>
            </ng-template>
          </p-table>
        </p-card>
      </div>
    }
  `,
  styles: ``,
})
export class CreditYearComponent implements OnInit {
  message = inject(MessagesService);
  selectService = inject(SelectorService);
  searchYearService = inject(SearchYearService);
  searchYear = new FormControl();
  loading = false;
  data: any[] = [];
  year: any[] = [];
  results: any[] = [];
  totalExpense = 0;
  totalCashback = 0;
  averageAmount: number = 0;
  minAmount: number = 0; // จำนวนเงิน
  maxAmount: number = 0; //    "
  minMonthExpense: string = ''; // ชื่อเดือน
  maxMountExpense: string = ''; //   "
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.selectService.getYear().then((year) => {
      this.year = year;
    });
  }

  yearSearch() {
    let year = Number(this.searchYear.value.label) - 543;

    this.loading = true;

    this.searchYearService
      .loadYear(year)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.data = Object.keys(result.resultsE).map((key) => ({
            month: key,
            total: result.resultsE[key],
          }));
          this.maxMountExpense = result.maxMonth;
          this.minMonthExpense = result.minMonth;
          this.averageAmount = result.avg;
          this.totalExpense = result.totalExpenses;
          this.totalCashback = result.totalCashback;
          this.minAmount = result.min;
          this.maxAmount = result.max;
          this.results = result.resultsE; // to show table
          // console.log(JSON.stringify(this.results, null, 2));
        },
        error: (err) => {
          this.loading = false;
          this.message.addMessage('error', 'Error', err.message);
        },
        complete: () =>
          setTimeout(() => {
            this.loading = false;
            this.cdr.detectChanges();
          }, 100),
      });
  }
}
