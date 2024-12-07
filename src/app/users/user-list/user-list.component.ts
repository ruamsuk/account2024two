import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { UpdateUserRequest, UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { SharedModule } from '../../shared/shared.module';
import { MessagesService } from '../../services/messages.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { UserEditComponent } from '../user-edit.component';
import { Table } from 'primeng/table';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [SharedModule, NgOptimizedImage],
  template: `
    @if (users) {
      <div
        class="table-container justify-content-center align-items-center mt-3"
      >
        @if (loading) {
          <div class="loading-shade">
            <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
          </div>
        }
        <div class="card">
          <p-table
            #dt
            [value]="users"
            [rowHover]="true"
            [loading]="loading"
            [scrollable]="true"
            [globalFilterFields]="['displayName', 'email', 'role']"
            [tableStyle]="{ 'min-width': '30rem' }"
            scrollHeight="750px"
            styleClass="p-datable-striped z-0"
          >
            <ng-template pTemplate="caption">
              <div class="flex align-items-center justify-content-between">
                <span>
                  <p-button
                    [disabled]="!admin"
                    icon="pi pi-plus"
                    (onClick)="addEditUser('')"
                  ></p-button>
                </span>
                <span
                  class="hidden md:block tasadith text-green-400 text-3xl ml-auto"
                >
                  รายชื่อผู้ใช้งาน
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
                    (input)="dt.filterGlobal(getValue($event), 'contains')"
                  />
                  @if (searchValue.value) {
                    <span class="icons cursor-pointer" (click)="clear(dt)">
                      <i class="pi pi-times" style="font-size: 1rem"></i>
                    </span>
                  }
                </p-iconField>
              </div>
            </ng-template>
            <ng-template pTemplate="header">
              <tr>
                <th>#</th>
                <th>Photo</th>
                <th>displayName</th>
                <th>email</th>
                <th>role</th>
                <th style="min-width: 100px">Action</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user let-i="rowIndex">
              <tr>
                <td>{{ currentPage * rowsPerPage + i + 1 }}</td>
                <td>
                  @if (user?.photoURL) {
                    <img
                      [ngSrc]="user?.photoURL"
                      alt="photo"
                      height="80"
                      width="80"
                    />
                  } @else {
                    <img
                      [ngSrc]="'/images/dummy-user.png'"
                      alt="Profile Image"
                      height="80"
                      width="80"
                    />
                  }
                </td>
                <td>{{ user.displayName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td>
                  @if (admin) {
                    <i
                      class="pi pi-pen-to-square mr-2 ml-2 text-blue-400"
                      (click)="addEditUser(user)"
                    ></i>
                    <p-confirmPopup/>
                    <i
                      class="pi pi-trash mr-2 ml-2 text-orange-600"
                      (click)="conf($event, user)"
                    ></i>
                  } @else {
                    <i class="pi pi-lock text-100"></i>
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    }
  `,
  styles: `
    img {
      border-radius: 50%;
      width: 50px; /* ปรับขนาดตามต้องการ */
      height: 50px; /* ปรับขนาดตามต้องการ */
      object-fit: cover; /* เพื่อให้ภาพไม่บิดเบี้ยว */
    }

    .icons {
      position: relative;
      right: 30px;
      //top: 10px;
    }

    th {
      color: darkcyan !important;
      font-size: 18px;
      font-weight: bold !important;
      z-index: -1 !important;
    }

    th,
    td {
      /*   background-color: #eceaea;
         margin-left: 1rem !important;*/
      font-family: 'Sarabun', sans-serif !important;
    }
  `,
  providers: [ConfirmationService],
})
export class UserListComponent implements OnInit {
  ref: DynamicDialogRef | undefined;
  loading = false;
  searchValue = new FormControl();
  users: User[] = [];
  admin: boolean = false;
  currentPage = 0;
  rowsPerPage = 10;
  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private dialogService: DialogService,
    private userService: UserService,
    private messageService: MessagesService,
  ) {
    this.getRole();
    this.loadUser();
  }

  ngOnInit() {
  }

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  loadUser() {
    this.loading = true;
    this.userService.users$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: User[]) => {
          this.users = data.map((user) => {
            return {
              ...user,
              role:
                typeof user.role === 'object' && user.role !== null
                  ? (user.role as { name: string }).name
                  : user.role,
            };
          });
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.addMessage('error', 'Error', error.message);
          console.log(error.message);
        },
        complete: () => {
          setTimeout(() => {
            this.loading = false;
          }, 100);
        },
      });
  }

  getRole() {
    this.authService.isAdmin().then((isAdmin) => {
      this.admin = isAdmin;
    });
  }

  addEditUser(user: any) {
    let header = user ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้';
    this.ref = this.dialogService.open(UserEditComponent, {
      data: user,
      header: header,
      width: '360px',
      contentStyle: {overflow: 'auto'},
      breakpoints: {
        '960px': '360px',
        '640px': '360px',
        '390px': '360px',
      },
    });
    this.ref.onClose.subscribe((res: string) => {
      if (!(res == 'edit' || res == 'new')) {
        return;
      }
      this.loadUser();
    });
  }

  /**
   *
   * @param event
   * @param id
   */
  conf(event: Event, id: UpdateUserRequest) {
    console.log('event ', event, id);
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'ต้องการลบรายการนี้ แน่ใจ?',
      header: 'Confirmation',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-warning p-button-sm',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.userService.delete(id).subscribe({
          next: () => {
            this.messageService.addMessage(
              'info',
              'Warning',
              'ลบข้อมูลเรียบร้อยแล้ว',
            );
          },
          error: (error: any) => {
            this.messageService.addMessage('error', 'Error', error.message);
            this.setTime();
          },
          complete: () => {
            this.setTime();
          },
        });
        this.messageService.addMessage(
          'info',
          'Warning',
          'ลบข้อมูลเรียบร้อยแล้ว',
        );
      },
      reject: () => {
        this.messageService.addMessage('warn', 'Waring', 'ยกเลิกการลบแล้ว!');
      },
    });
  }

  setTime() {
    setTimeout(() => {
      this.loadUser();
    }, 100);
  }

  clear(table: Table) {
    table.clear();
    this.searchValue.reset();
  }
}
