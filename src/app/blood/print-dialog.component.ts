import { Component, OnDestroy } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';

@Component({
  selector: 'app-print-dialog',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (dataPrint) {
      <div id="printContent">
        <table class="custom-table">
          <thead>
          <tr>
            <th rowspan="3" style="width: 15%">Date</th>
          </tr>
          <tr>
            <th colspan="2" style="width: 20%" class="text-center">
              Morning<br/><span class="text-gray-600"
            >(Before medicine)</span
            >
            </th>
            <th colspan="2" style="width: 20%" class="text-center">
              Evening<br/><span class="text-gray-600"
            >(After medicine )</span
            >
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
            @for (blood of dataPrint.blood; track $index) {
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

      <div class="text-center mt-5">
        <p-button
                class="mr-2"
                label="Convert2Pdf"
                severity="secondary"
                size="small"
                (onClick)="generatePDF()"
        ></p-button>
        <p-button
                class="mr-2"
                label="Cancel"
                severity="secondary"
                size="small"
                (onClick)="ref.close()"
        ></p-button>
      </div>
    }
	`,
  styles: `
    #printContent {
      padding: 5px;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
      color: black;
    }

    .custom-table th,
    .custom-table td {
      border: 1px solid #000000;
      padding: 5px 0 5px 15px;
      font-family: 'Sarabun', sans-serif !important;
      font-size: 14px !important;
      font-weight: normal !important;
    }

    .custom-table th {
      padding-top: 6px;
      padding-bottom: 6px;
      text-align: left;
      //background-color: #f2f2f2;
      color: black !important;
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
        padding: 8px;
        text-align: left;
      }

      th {
        background-color: #f2f2f2; /* สีพื้นหลัง */
        font-weight: bold;
      }

      .thick-border {
        border-width: 2px; /* กำหนดความหนาของเส้นตาราง */
      }
      /* ตั้งค่าหน้ากระดาษ */
      @page {
        margin: 1cm;
        size: A4 portrait;
      }
    }
  `,
})
export class PrintDialogComponent implements OnDestroy {
  dataPrint: any;

  constructor(
    public ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
  ) {
    if (this.config.data) {
      this.dataPrint = config.data;
    }
  }

  generatePDF(): void {
    const data = document.getElementById('printContent');
    if (data) {
      html2canvas(data).then((canvas) => {
        const imgWidth = 208;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        let position = 0;
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save('blood-pressure.pdf');
      });
      setTimeout(() => {
        this.ref.close();
      }, 1000);
    }
  }

  ngOnDestroy() {
    if (this.ref) this.ref.close();
  }
}
