import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!(await auth.hasSession())) {
    return router.createUrlTree(['/admin/login']);
  }

  const profile = await auth.loadProfile();

  if (!profile) {
    await auth.signOut();
    return router.createUrlTree(['/admin/login']);
  }

  if (!profile.active) {
    await auth.signOut();
    return router.createUrlTree(['/admin/login']);
  }

  return true;
};
