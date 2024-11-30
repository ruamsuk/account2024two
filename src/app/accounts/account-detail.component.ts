import { Component, inject } from '@angular/core';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { SharedModule } from '../shared/shared.module';
import { Account } from '../models/account.model';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    <table class="table">
      <tr>
        <th>วันที่:</th>
        <td>
          {{ account.date | thaiDate }}
        </td>
      </tr>
      <tr>
        <th>รายการ:</th>
        <td>
          {{ account.details }}
        </td>
      </tr>
      <tr>
        <th>จำนวนเงิน:</th>
        <td>
          {{ account.amount | currency: '' : '' }}
        </td>
      </tr>
      <tr>
        <th>หมายเหตุ:</th>
        <td>
          {{ account.remark }}
        </td>
      </tr>
      <tr>
        <th>บันทึกเมื่อ:</th>
        <td>
          {{ account.create | thaiDate: 'mediumt' }}
        </td>
      </tr>
      <tr>
        <th>แก้ไขเมื่อ:</th>
        <td>
          {{ account.modify | thaiDate: 'mediumt' }}
        </td>
      </tr>
      <tr>
        <th>รับ/จ่าย:</th>
        <td>
          <span
            class="{{ account.isInCome ? 'text-green-400' : 'text-red-400' }}"
          >
            {{ account.isInCome ? 'รายรับ' : 'รายจ่าย' }}
          </span>
        </td>
      </tr>
    </table>
    <div class="flex justify-content-end">
      <p-button
        label="Close"
        severity="secondary"
        size="small"
        (onClick)="closeDialog()"
      />
    </div>
  `,
  styles: `
    table {
      border-collapse: collapse;
      font-family: 'Sarabun', sans-serif;
      font-size: 18px;
      margin-bottom: 1rem;
      //color: #212529; /** ถ้ากำหนดสี มันจะไม่แสดงข้อมูลในตาราง **/
      width: 100%;
    }

    .table th,
    .table td {
      padding: 0.5rem;
      vertical-align: top;
      border-top: 1px solid #c7cacb;
      overflow: hidden;
    }

    .table th,
    .table td:last-child {
      border-bottom: 1px solid grey;
    }

    table th {
      text-align: right;
      padding-right: 5px;
      height: 2rem;
      width: 36%;
    }
  `,
})
export class AccountDetailComponent {
  ref = inject(DynamicDialogRef);
  accountData = inject(DynamicDialogConfig);
  account!: Account;

  constructor() {
    if (this.accountData.data) this.account = this.accountData.data;
  }

  closeDialog() {
    this.ref.close();
  }
}
