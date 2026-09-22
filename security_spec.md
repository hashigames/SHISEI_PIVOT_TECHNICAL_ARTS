# Security Spec: Action Library and Weapons Store Fortress Rules

## 1. Data Invariants
1.   **Action Id Integrity**: All action ids must be formatted correctly (e.g. `L-01`, `C-10`) and must be between 2 and 32 characters in size, matching the validation pattern.
2.   **Action Update Authorization**: Updates to `actions` (including frame updates or note corrections) can only be executed by administrators.
3.   **Weapon Update Authorization**: Updates to the `weapons` store can only be executed by administrators.
4.   **Verification Mandatory**: All write operations must originate from verified authenticated users with trusted admin configurations.
5.   **Immortal Fields**: Fields like `createdAt` or primary IDs cannot be mutated or changed after creation.
6.   **Strict Array Size Limits**: Frames/Images list arrays cannot exceed `5` elements to prevent wallet exhaustion attacks.

## 2. The "Dirty Dozen" Payloads
These payloads attempt to breach security bounds by spoofing roles, modifying read-only state indicators, elevating privileges, or uploading oversized structures. We will verify they are blocked:

1.  **Payload A**: Create an action with an empty category. (Blocked: Schema validator)
2.  **Payload B**: Set an action's author role or privilege manually using client payloads. (Blocked: Auth validator)
3.  **Payload C**: Overwrite `createdAt` with a backdated timestamp. (Blocked: Temporal server timestamp validation)
4.  **Payload D**: Push more than 5 elements into `frames` array. (Blocked: List boundary checker)
5.  **Payload E**: Submit an action ID containing malicious path symbols `../admin_override`. (Blocked: Regex ID hardener)
6.  **Payload F**: Modify an action document as an anonymous, unauthenticated user. (Blocked: Authenticated check)
7.  **Payload G**: Delete any action from the library as a non-admin. (Blocked: Admin role check)
8.  **Payload H**: Injection of a massive 2MB raw buffer string in comments to drain server resources. (Blocked: String size limits)
9.  **Payload I**: Modify `id` after creation. (Blocked: Immortal field validator)
10. **Payload J**: Create a weapon with no `hand_grip` property. (Blocked: Required attributes list checker)
11. **Payload K**: List the entire action repository as an unverified/inactive client. (Blocked: Rule-enforced verification check)
12. **Payload L**: Access admin details of another profile. (Blocked: PII Private Isolation checkpoint)

## 3. The Rules Draft
These tests will map to permission denials on our Firestore rules matching these constraints. Let's proceed to make sure the rules are fully documented.
