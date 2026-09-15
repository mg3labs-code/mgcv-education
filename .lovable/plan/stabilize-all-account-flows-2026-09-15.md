# Stabilize all account flows

## Changes
- Keep the student or teacher account panel visible after sign-in submission until the correct dashboard is ready, preventing the homepage flash.
- Replace the post-signup homepage return with a clear “check your email” confirmation inside the same panel.
- Preserve the selected student or teacher portal when returning from forgot password.
- Make sign-out return consistently to the real sign-in homepage and show a friendly failure message if sign-out fails.
- Keep password rules consistent across signup and password reset.

## Verification
- Test password typing without submission for student and teacher.
- Test invalid sign-in, successful student sign-in, successful teacher sign-in, and both sign-out controls.
- Test student and teacher forgot-password requests, expired reset links, and the new-password form.
- Confirm protected pages return signed-out visitors to the homepage.
