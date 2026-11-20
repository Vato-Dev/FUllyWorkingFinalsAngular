import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

function getMessage(error: HttpErrorResponse, url: string): string {
  switch (error.status) {
    case 0:
      return 'Cant connect to hte server';
    case 400:
      return url.endsWith('/auth/login') ? 'Icorrect login or password ' : 'Некорректный запрос';
    case 401:
      return 'Session is expired please logiiin';
    case 404:
      return 'Not found';
    case 500:
      return 'Error on server, try again';
    default:
      return `Request failed (${error.status})`;
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        toast.show(getMessage(error, req.url), 'error');
        if (error.status === 401) {
          auth.logout();
        }
      }
      return throwError(() => error);
    }),
  );
};
