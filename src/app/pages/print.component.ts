import { Component } from '@angular/core';
import { DataService } from '../services/data.service';
import { SharedModule } from '../shared/shared.module';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';

@Component({
  selector: 'app-print',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    <div class="print-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th rowspan="3" style="width: 15%">Date</th>
          </tr>
          <tr>
            <th colspan="2" style="width: 20%" class="text-center">
              Morning<br /><span class="text-gray-600">(Before medicine)</span>
            </th>
            <th colspan="2" style="width: 20%" class="text-center">
              Evening<br /><span class="text-gray-600">(After medicine )</span>
            </th>
          </tr>
          <tr>
            <th style="width: 15%">BP1</th>
            <th style="width: 15%">BP2</th>
            <th style="width: 15%">BP1</th>
            <th style="width: 15%">BP2</th>
          </tr>
        </thead>
        <tbody>
          @for (blood of data.blood; track $index) {
            <tr>
              <td>{{ blood.date | thaiDate }}</td>
              <td>{{ blood.morning.bp1 }}</td>
              <td>{{ blood.morning.bp2 }}</td>
              <td>{{ blood.evening.bp1 }}</td>
              <td>{{ blood.evening.bp2 }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div class="text-center mt5 noPrint">
      <p-button
        label="Print"
        severity="secondary"
        size="small"
        (onClick)="printPage()"
      ></p-button>
    </div>
  `,
  styles: `
    .print-container {
      width: 21cm;
      height: 29.7cm;
      margin: 0;
      padding: 1cm;
      page-break-after: always;
    }

    .noPrint {
      // display: none;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
      color: black;
    }

    .custom-table th,
    .custom-table td {
      border: 1px solid #ddd;
      padding: 4px;
      font-family: 'Sarabun', sans-serif !important;
      font-size: 14px !important;
      font-weight: bolder !important;
    }

    .custom-table th {
      padding-top: 6px;
      padding-bottom: 6px;
      text-align: left;
      //background-color: #f2f2f2;
      color: black;
    }

    @media print {
      button {
        .p-button-label {
          display: none;
        }
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      table,
      th,
      td {
        border: 1px solid black;
      }

      th,
      td {
        padding: 10px;
        text-align: left;
      }

      /* ตั้งค่าหน้ากระดาษ */
      @page {
        margin: 1cm;
        size: A4 portrait;
      }
    }
  `,
})
export class PrintComponent {
  data: any;

  constructor(private dataService: DataService) {
    this.dataService.currentData.subscribe((data) => {
      this.data = data;
    });
  }

  printPage(): void {
    window.print();
  }
}
