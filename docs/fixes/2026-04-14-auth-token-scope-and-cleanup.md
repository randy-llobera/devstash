# 2026-04-14 Auth Token Scope And Cleanup

## Scope

- Forgot password implementation
- Shared `VerificationToken` usage across email verification and password reset
- Cleanup behavior for deleted users

## Finding 1

- Title: Cross-flow token consumption between email verification and password reset
- Severity: Medium
- Risk: A valid token can be invalidated by the wrong endpoint. Users can lose a valid verification or password reset link without completing the intended action.

### What I found

- Both flows now share `VerificationToken`.
- Email verification tokens use `identifier = <email>`.
- Password reset tokens use `identifier = password-reset:<email>`.
- `src/app/verify-email/route.ts` looks up a token only by hashed `token`, not by token type or identifier shape.
- If a password reset token is sent to `/verify-email`, the route reaches `updateMany({ where: { email: verificationToken.identifier } })`, matches zero users, then deletes all rows for that identifier.
- `src/app/api/auth/password/reset/route.ts` has the inverse problem. It also looks up only by hashed `token`, then deletes invalid tokens when the identifier is not a password reset identifier.

### Relevant files

- `src/app/verify-email/route.ts`
- `src/app/api/auth/password/reset/route.ts`
- `src/lib/email-verification.ts`

### Why this matters

- Sharing the table is fine, but lookup and deletion currently trust any matching token row.
- A mistyped link, copied token, or accidental request to the wrong endpoint can consume the token.
- This is a regression introduced by reusing `VerificationToken` without a type discriminator in the read path.

### Likely fix direction

- Add explicit flow checks before mutating or deleting:
  - Verification route should only accept tokens whose `identifier` is a plain email identifier.
  - Reset route should only accept tokens whose `identifier` starts with `password-reset:`.
- Prefer rejecting mismatched token types without deleting them.
- Consider extracting token helper utilities so each route can validate token type consistently.

### Notes for later

- Existing helper: `getPasswordResetEmail()` already identifies reset tokens.
- There is no equivalent helper yet for "is email verification token".
- If a stronger separation is needed later, a dedicated token type field or separate model would remove this ambiguity, but that is outside the current minimal fix.

## Finding 2

- Title: User cleanup script misses password reset tokens
- Severity: Medium
- Risk: Deleting users can leave orphaned password reset tokens behind. They will eventually expire, but cleanup is incomplete and counts are misleading.

### What I found

- `scripts/delete-non-demo-users.ts` counts and deletes verification tokens only where `identifier` is exactly one of the user emails being deleted.
- Password reset tokens now use `identifier = password-reset:<email>`.
- Those reset tokens are not included in the script's `count()` or `deleteMany()` filters.

### Relevant files

- `scripts/delete-non-demo-users.ts`
- `src/lib/email-verification.ts`

### Why this matters

- The script reports token cleanup as complete when it is only deleting email verification tokens.
- Orphaned reset tokens remain after the user row is deleted.
- This is low-volume in practice, but it is still incorrect cleanup behavior.

### Likely fix direction

- Update the cleanup script to include both identifier formats:
  - `<email>`
  - `password-reset:<email>`
- Keep the summary counts aligned with the new delete scope.

### Notes for later

- A small helper that returns all token identifiers for a user email would keep this logic centralized.
- Search references used during review:
  - `rg -n "verificationToken\\.(deleteMany|count|findUnique|create|delete)" src scripts | sort`

## Verification status at time of note

- `npm run lint` passed
- `npm run typecheck` passed
- Feature review verdict: needs changes before complete
- Full browser/email end-to-end verification was not run
