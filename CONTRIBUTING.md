# Contributing To Pull Request Choir

Thanks for adding a voice.

The whole point is that contribution should feel small, public, and permanent. Please keep your PR focused on one voice unless you are fixing project code.

## Add A Voice

1. Fork the repo.
2. Run the wizard:

   ```bash
   npm install
   npm run new-voice
   ```

3. Validate and build:

   ```bash
   npm run validate
   npm run build
   ```

4. Open a pull request.

## Voice Rules

- Use one JSON file in `community/voices/`.
- Name the file after the `id`, for example `community/voices/your-id.json`.
- Keep `phrase` between 12 and 140 characters.
- Do not include links in the phrase.
- Keep it safe for a public, mixed-age open source project.
- Reply to up to three existing voice ids with `respondsTo`.

Example:

```json
{
  "id": "your-id",
  "handle": "your-github-handle",
  "displayName": "Your Display Name",
  "phrase": "One small note for a song nobody can finish alone.",
  "mood": "wonder",
  "note": "E4",
  "color": "#62f7d4",
  "respondsTo": ["first-light"]
}
```

## Moods

- `wonder`
- `hope`
- `defiance`
- `focus`
- `calm`
- `joy`
- `chaos`

## Notes

Use one of:

```text
C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 A5
```

## Code Changes

For code changes, please explain the user-facing effect and run:

```bash
npm run validate
npm run build
npm run smoke
```
