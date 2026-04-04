# Documentation development

The Pfeil documentation is written in Markdown and built with Sphinx and Myst-Parser.

## Adding a page to the sidebar

Adding a new documentation page to the sidebar is easily done by just adding a line to the `{toctree}` command in `index.md`. If we want to add `my-cool-guide.md` to the User's Guide section, we just need to add this line:
```
:::{toctree}
:caption: User's guide
:maxdepth: 2

users-guide/help
users-guide/my-cool-guide
:::
```
Note that each of those pages will be listed in the sidebar in the same order as they are here.

## Building and serving the documentation locally

When making changes to the documentation, you should look them over in their rendered form to make sure everything looks alright. You can do this by building the documentation manually and serving it out of your filesystem to localhost.

1. Create a dev environment for Pfeil (make sure to install all deps in `dev-spec.txt`).
```
conda create -y -n pfeil-dev --file dev-spec.txt
conda activate pfeil-dev
npm install --save @types/jest
```

2. Build the docs and serve them locally. This can be done in a few different ways:
    
    - *Option 1:* Use `sphinx-autobuild`. The site will automatically re-build and refresh every time you save a change to any file in the `docs` folder. This is the recommended option as it's handy for ongoing development.
        ```
        sphinx-autobuild docs docs/_build/html
        ```

    - *Option 2:* Locally deploy and serve both the Pfeil site and the documentation from the project root. This is helpful for checking navigation between the two sites.
        ```
        make build
        cd dist
        python -m http.server 8000
        ```

3. Visit the URL returned by whichever command you used to serve the site, and you'll see your finished documentation.

:::{note}
The way Markdown is rendered by GitHub differs from the way it's rendered by Sphinx/Myst. When making documentation that is likely to be viewed from the docs site, favor Sphinx/Myst. When making something that's likely to be viewed on GitHub (like the README), favor GitHub.
:::
