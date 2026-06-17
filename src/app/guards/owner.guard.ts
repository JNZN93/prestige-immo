import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ownerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const profile = await auth.loadProfile();

  if (profile?.role === 'owner' && profile.active) {
    return true;
  }

  return router.createUrlTree(['/admin/properties']);
};
