# Flashcards

TODO:

- come up with a snappy name for this app
- add an introduction to the app here, maybe copied from site docs?

## Development

The site and all of its assets are served out of the flat directory `dist`. 

### Creating an instance of the site

Install all packages listed in `dev-spec.txt`. This is easy with a package manager such as [Miniconda](https://www.anaconda.com/docs/getting-started/miniconda/main). The process of creating a dev environment using Miniconda is like so:
```
conda create -y -n flashcards-dev --file dev-spec.txt
conda activate flashcards-dev
```

Install the custom types by running:
```
npm install --save @types/jest
```

Then, run:
```
make build
``` 
to built all of the Typescript code into `dist/bundle.js` which will copy all static assets into the `dist` directory automatically. 

> ⚠️ **_NOTE:_**  You'll need to re-run `make build` each time you change the source code. Running `make clean` before `make build` will create a new `dist` directory, which may be helpful when debugging.

Once built, the site can be served directly out of `dist` with a file server like the simple Python HTTP server:
```
cd dist
python3 -m http.server
```

The site will be viewable at the local URL provided by `python3 -m http.server` (typically `http://[::]:8000/`). Visit that URL and check out your instance of the site!

You can also run:
```
npm run develop
``` 
for a live Node + Typescript + Webpack development server that automatically updates its deployment as you make changes to Typescript files.

## Acknowledgments

Emojis taken from Openmoji. Open icons taken from [uxwing](https://uxwing.com).
