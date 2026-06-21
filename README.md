# Pull Request Choir

Every merged pull request adds one permanent note to a song made by strangers.

Pull Request Choir is a git-native community instrument. There is no backend, no database, no tracking, and no account system beyond GitHub. Contributors add one small JSON file in `community/voices/`. The build script validates it, places it into a living constellation, and turns it into a playable Web Audio voice.

The more people contribute, the better the project becomes.

Live demo: https://pondsec.github.io/pull-request-choir/

The submitted note stays visible as metadata, but playback is automatically mapped into a generated melody. Each voice plays one note; the engine chooses that note from a shared progression using basic composition rules: chord tones on strong positions, mostly stepwise motion, limited leaps, phrase targets, and tension resolving back into stable tones.

## Try It

```bash
npm install
npm run dev
```

Then open the local URL and press **Listen**.

## Add Your Voice

```bash
git clone https://github.com/PondSec/pull-request-choir.git
cd pull-request-choir
npm install
npm run new-voice
npm run validate
npm run build:data
```

Open a pull request with your new file from `community/voices/`.

One voice per person is the spirit of the project. Your voice needs:

- a GitHub handle
- a display name
- one sentence, 12-140 characters, no links
- a mood
- a note
- a color
- up to three existing voice ids you are replying to

## Why This Exists

Most viral repositories are things you look at. Pull Request Choir is something you join.

It turns the pull request itself into the social mechanic: every merge changes the artifact, and every contributor can immediately see and hear that they are part of something larger than the original repo.

## Scripts

```bash
npm run new-voice     # interactive contribution wizard
npm run validate      # validate all community voices
npm run build:data    # regenerate public/choir.json
npm run dev           # serve the static page locally
npm run smoke         # quick static page/data smoke test
```

## Project Shape

```text
community/voices/     Community-owned voice JSON files
scripts/              Validator, generator, and contribution wizard
index.html            Standalone HTML/CSS/JS interface
public/choir.json     Static generated data for remixers
```

## Remix Ideas

- make a music video from `public/choir.json`
- build a CLI that plays the choir in the terminal
- add a “daily merge” arrangement mode
- visualize forks as alternate constellations
- use the voice graph as a collaborative poem

## Community Rule

Be sincere, brief, and non-spammy. A tiny public note can be strange, funny, emotional, or technical, but it should add something human to the choir.

## License

MIT
