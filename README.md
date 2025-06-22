# Flashcards

TODO:

- come up with a snappy name for this app
- add an introduction to the app here, maybe copied from site docs?

## Development

The site and all of its assets are served out of the flat directory `dist`. Run `make build` to built all of the Typescript code into `dist/bundle.js` and copy all static assets into the `dist` directory automatically. Once built, the site can be served directly out of `dist` with a simple file server like the simple Python HTTP server launched with `python3 -m http.server`.

You can also run `npm run develop` for a live Node + Typescript + Webpack development server that automatically updates its deployment as you make changes to Typescript files.

## Acknowledgments

Emojis taken from Openmoji. Open icons taken from [uxwing](https://uxwing.com).
