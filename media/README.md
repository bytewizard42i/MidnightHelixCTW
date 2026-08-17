# Media

Source assets for HelixCTW: decks, diagrams, pitch recordings, and key art.
Web-facing copies live in `apps/web/public/` and are served by the deployed
site; the files here are the originals those copies came from.

## Asset library (NotebookLM)

A larger collection of HelixCTW assets and research material is kept outside
this repository:

<https://notebook.google.com/notebook/83be4dac-798e-4b20-a3b6-841d407dd9a4>

The link is access-controlled and requires a Google sign-in with permission on
the notebook, so it will not open for the general public or for CI. Treat it as
a working library rather than a citable source: anything a reader is expected
to verify belongs in this repository, under a status label from
`docs/IMPLEMENTATION_STATUS.md`.

Some files already here, such as the NotebookLM mind map, originated there.

## Adding assets

Large binaries are deliberately kept out of git where possible. Check
`.gitignore` before committing new media, keep web-facing images compressed,
and prefer linking to the notebook over committing another large original.
