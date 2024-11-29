import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  template: `
    <footer>
      <div class="flex justify-content-center align-items-center">
        <p class="visible-md text-xl text-gray-500 dark:text-gray-400 px-2">
          Copyright &copy; {{ _year }} Ruamsuk&trade; Kanchanaburi.
        </p>
        <p class="hidden-md text-xl text-gray-500 dark:text-gray-400 px-2">
          Copyright &copy; {{ _year }} Ruamsuk&trade; Kanchanaburi.
        </p>
      </div>
    </footer>
  `,
  styles: `
    .truncate {
      display: block;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    /*footer {
      position: fixed;
      left: 0;
      bottom: 0;
      width: 100%;
      background-color: var(--background-color-b);
      text-align: center;
      padding: 10px;
      z-index: -1;
    }*/

    .hidden-md {
      display: none;
    }

    @media (min-width: 768px) {
      .hidden-md {
        display: block;
      }
      .visible-md {
        display: none;
      }
    }
  `,
})
export class FooterComponent {
  _year = new Date().getFullYear();
}
