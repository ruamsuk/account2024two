import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SelectorService {
  monthSearch() {
    /** month */
    return [
      {
        label: 'มกราคม',
      },
      {
        label: 'กุมภาพันธ์',
      },
      {
        label: 'มีนาคม',
      },
      {
        label: 'เมษายน',
      },
      {
        label: 'พฤษภาคม',
      },
      {
        label: 'มิถุนายน',
      },
      {
        label: 'กรกฎาคม',
      },
      {
        label: 'สิงหาคม',
      },
      {
        label: 'กันยายน',
      },
      {
        label: 'ตุลาคม',
      },
      {
        label: 'พฤศจิกายน',
      },
      {
        label: 'ธันวาคม',
      },
    ];
  }

  yearSearch() {
    let max = new Date().getFullYear() + 543;
    let min = max - 5;
    // let future = max + 5;
    // for (let i = 1; i <= future; i++) this.year.push(i);
    return [
      {
        label: min,
      },
      {
        label: min + 1,
      },
      {
        label: min + 2,
      },
      {
        label: min + 3,
      },
      {
        label: min + 4,
      },
      {
        label: min + 5,
      },
      {
        label: min + 6,
      },
      {
        label: min + 7,
      },
      {
        label: min + 8,
      },
      {
        label: min + 9,
      },
      {
        label: min + 10,
      },
    ];
  }

  roleSearch() {
    return [
      {
        label: 'admin',
      },
      {
        label: 'manager',
      },
      {
        label: 'user',
      },
    ];
  }

  getRole() {
    return Promise.resolve(this.roleSearch());
  }

  getMonth() {
    return Promise.resolve(this.monthSearch());
  }

  getYear() {
    return Promise.resolve(this.yearSearch());
  }
}
