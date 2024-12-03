import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { AuthService } from './services/auth.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenuItem, PrimeNGConfig } from 'primeng/api';
import { MessagesService } from './services/messages.service';
import { UserProfileComponent } from './auth/user-profile.component';
import { FooterComponent } from './pages/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SharedModule, FooterComponent],
  template: `
    <p-toast />
    @if (currentUser()) {
      <div class="card">
        <p-menubar [model]="items">
          <ng-template pTemplate="start">
            <img src="/images/primeng-logo.png" alt="logo" />
          </ng-template>
          <ng-template pTemplate="item" let-item>
            <ng-container>
              <div class="z-0">
                <a [routerLink]="item.route" class="p-menuitem-link">
                  <span [class]="item.icon"></span>
                  <span class="ml-2">{{ item.label }}</span>
                </a>
              </div>
            </ng-container>
          </ng-template>
          <ng-template pTemplate="end">
            <div class="flex align-items-center gap-2">
              <p-avatar
                image="{{
                  currentUser()?.photoURL ?? '/images/dummy-user.png'
                }}"
                shape="circle"
                class=""
              />
              <span
                (click)="menu.toggle($event)"
                class="font-bold text-gray-400 mr-2 cursor-pointer sarabun -mt-1"
              >
                {{
                  currentUser()?.displayName
                    ? currentUser()?.displayName
                    : currentUser()?.email
                }}
                <i class="pi pi-angle-down"></i>
              </span>
              <p-tieredMenu #menu [model]="subitems" [popup]="true" />
            </div>
          </ng-template>
        </p-menubar>
      </div>
    }
    <div class="app-container">
      <router-outlet />
    </div>
    <app-footer />
  `,
  styles: [
    `
      .avatar-image img {
        width: 120px; /* กำหนดขนาดที่ต้องการ */
        height: 120px; /* กำหนดขนาดที่ต้องการ */
        object-fit: cover; /* ปรับขนาดภาพให้พอดี */
      }

      .p-menubar {
        position: relative;
        z-index: 1000; /* ปรับค่า z-index ให้สูงกว่า <th> */
      }

      .p-menubar .p-menuitem-link {
        position: relative;
        z-index: 1001; /* ปรับค่า z-index ให้สูงกว่า <th> */
      }

      :host ::ng-deep .p-toast-message {
        font-family: 'Sarabun', sans-serif;
        font-size: 1.125rem;
        font-style: italic;
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  message = inject(MessagesService);
  pConfig = inject(PrimeNGConfig);
  public dialogService = inject(DialogService);
  router = inject(Router);

  items: MenuItem[] | undefined;
  subitems: MenuItem[] | undefined;
  ref: DynamicDialogRef | undefined;
  currentUser = this.auth.currentUser;

  constructor() {}

  @HostListener('window:mousemove')
  @HostListener('window:keydown')
  resetTimer() {
    this.auth.resetTimer();
  }

  ngOnInit() {
    this.auth.getUserState().subscribe((user) => {
      if (user) {
        // console.log(JSON.stringify(user, null, 2));
      }
    });
    this.pConfig.ripple = true;
    this.auth.getTranslations().subscribe((translations) => {
      this.pConfig.setTranslation(translations);
    });
    this.items = [
      {
        label: 'Home',
        route: 'landing',
        icon: 'pi pi-home',
      },
      {
        label: 'Accounts',
        icon: 'pi pi-database',
        items: [
          {
            label: 'รายการบัญชี',
            icon: 'pi pi-list',
            route: '/account/account-list',
          },
          {
            label: 'ตามช่วงเวลา',
            icon: 'pi pi-calendar-clock',
            route: '/account/between',
          },
          {
            label: 'ช่วงเวลาและรายการ',
            icon: 'pi pi-calendar-plus',
            route: '/account/between-detail',
          },
          {
            label: 'ตลอดทั้งปี',
            icon: 'pi pi-book',
            route: '/account/allyear',
          },
        ],
      },
      {
        label: 'Credits',
        icon: 'pi pi-credit-card',
        items: [
          {
            label: 'รายการเครดิต',
            icon: 'pi pi-list',
            route: '/credit/credit-list',
          },
          {
            label: 'ตามช่วงเวลา',
            icon: 'pi pi-clock',
            route: '/credit/between',
          },
          {
            label: 'ตลอดปี',
            icon: 'pi pi-book',
            route: '/credit/allyear',
          },
        ],
      },
      {
        label: 'Blood pressure',
        icon: 'pi pi-heart',
        items: [
          {
            label: 'Blood List',
            icon: 'pi pi-list',
            route: '/bloods/blood-list',
          },
          {
            label: 'Time period',
            icon: 'pi pi-calendar-clock',
            route: '/bloods/blood-time-period',
          },
          {
            label: 'Year period',
            icon: 'pi pi-calendar-plus',
            route: '/bloods/blood-year-period',
          },
        ],
      },
      {
        label: 'Monthly',
        icon: 'pi pi-calendar',
        items: [
          {
            label: 'แสดงวันที่กำหนด',
            icon: 'pi pi-book',
            route: 'monthly',
          },
        ],
      },
      {
        label: 'Manage users',
        icon: 'pi pi-users',
        items: [
          {
            label: 'Users list',
            icon: 'pi pi-users',
            route: 'manage-user',
          },
        ],
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {
          this.logout();
        },
      },
    ];
    this.subitems = [
      {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => this.userDialog(),
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
      },
    ];
  }

  userDialog() {
    this.ref = this.dialogService.open(UserProfileComponent, {
      data: this.currentUser(),
      header: 'User Details',
      width: '500px',
      modal: true,
      contentStyle: { overflow: 'auto' },
      breakpoints: {
        '960px': '500px',
        '640px': '500px',
      },
    });
  }

  logout(): void {
    this.auth.logout().then(() => this.router.navigateByUrl('/auth/login'));
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }
}
