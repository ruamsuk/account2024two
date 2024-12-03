import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  collectionData,
} from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';
import { MonthConversionService } from './month-conversion.service';
import { YearSummary, MonthlyData, AccountData } from '../models/account.model';

@Injectable({
  providedIn: 'root',
})
export class IncomeExpenseService {
  constructor(
    private firestore: Firestore,
    private monthConversionService: MonthConversionService,
  ) {}

  getIncomeExpenseSummary(year: number) {
    // แปลงปี พ.ศ.เป็น ค.ศ.
    year = Number(year) - 543;
    // ดึงข้อมูลรอบบัญชีจาก collection 'monthly'
    const monthlyQuery = query(collection(this.firestore, 'monthly'));

    // ดึงข้อมูลบัญชีจาก collection 'accounts'
    const accountsQuery = query(collection(this.firestore, 'accounts'));

    return combineLatest([
      collectionData(monthlyQuery, { idField: 'id' }) as Observable<
        MonthlyData[]
      >,
      collectionData(accountsQuery, { idField: 'id' }) as Observable<
        AccountData[]
      >,
    ]).pipe(
      map(([monthlyData, accountsData]) => {
        const yearSummary: YearSummary = {};

        // เรียงลำดับ monthlyData ตามเดือนและวันที่เริ่มต้น
        monthlyData.sort((a, b) => {
          const monthA = this.monthConversionService.thaiMonthToNumber(a.month);
          const monthB = this.monthConversionService.thaiMonthToNumber(b.month);
          if (monthA !== undefined && monthB !== undefined) {
            return (
              monthA - monthB ||
              a.datestart.toDate().getTime() - b.datestart.toDate().getTime()
            );
          }
          return 0;
        });

        monthlyData.forEach((month) => {
          const startDate = month.datestart.toDate();
          const endDate = month.dateend.toDate();

          if (
            startDate.getFullYear() === year ||
            endDate.getFullYear() === year ||
            (startDate.getFullYear() < year && endDate.getFullYear() > year)
          ) {
            const monthIncome = accountsData
              .filter(
                (account) =>
                  account.date.toDate() >= startDate &&
                  account.date.toDate() <= endDate &&
                  account.isInCome,
              )
              .reduce((sum, account) => sum + account.amount, 0);

            const monthExpense = accountsData
              .filter(
                (account) =>
                  account.date.toDate() >= startDate &&
                  account.date.toDate() <= endDate &&
                  !account.isInCome,
              )
              .reduce((sum, account) => sum + account.amount, 0);

            const monthBalance = monthIncome - monthExpense;

            yearSummary[month.month] = {
              income: monthIncome,
              expense: monthExpense,
              balance: monthBalance,
            };
          } // end if
        });

        return yearSummary;
      }),
    );
  }
}
