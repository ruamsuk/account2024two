import { Injectable } from '@angular/core';
import { Monthly } from '../models/monthly.model';
import { from, Observable } from 'rxjs';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  orderBy,
  query,
  updateDoc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MonthlyService {
  constructor(private firestore: Firestore) {}

  loadMonthly(): Observable<Monthly[]> {
    const db = collection(this.firestore, 'monthly');
    const q = query(db, orderBy('datestart', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  addMonthly(monthly: any) {
    const fake: Monthly = {
      datestart: new Date(monthly.datestart),
      dateend: new Date(monthly.dateend),
      month: monthly.month.label,
    };
    const ref = collection(this.firestore, 'monthly');
    return from(addDoc(ref, fake));
  }

  updateMonthly(monthly: any) {
    /**
     * ค่า month ที่ส่งมาเป็น array {'label': 'ชื่อเดือน', ...}
     *  ต้องแปลงเอาแต่ชื่อเดือนเท่านั้น
     * */
    const data = {
      id: monthly.id,
      month: monthly.month.label,
      datestart: monthly.datestart,
      dateend: monthly.dateend,
    };
    const db = doc(this.firestore, 'monthly', `${monthly.id}`);
    return from(updateDoc(db, data));
  }

  deleteMonth(id: string | undefined) {
    const docInstance = doc(this.firestore, 'monthly', `${id}`);
    return from(deleteDoc(docInstance));
  }
}
