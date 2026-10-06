# Five-minute developer trial

Ask three developers who have not worked on DotMap to try the same task independently. Give them the public customizer URL, not a guided walkthrough:

https://pvj7000.github.io/map-dots/

The task: make a map of three office locations, including two in the same city, change its colors, and put it on a website. Start a timer when they open the page; stop when the map appears on their site. Aim for five minutes. Record actual results before choosing the next improvements.

## Three integration trials

1. **Plain HTML:** use the Locations and Design tabs, choose Export → HTML, download the page, and serve it on an existing website. Both nearby locations should remain visible and inspectable. This route needs no npm installation.
2. **React:** make the same map, choose Export → React, install the beta package, save the generated code as `CustomMap.tsx`, and render `<CustomMap />`. Follow the customizer's Get started instructions. Until npm publication, install the packed archive from the successful Checks workflow's `dotmap-beta-…` artifact.
3. **Preset reuse:** download the JSON preset, refresh the customizer, then import the preset in a fresh browser session. The geometry, places, labels, and colors should match. Embed it using the integration the developer normally uses.

Let each developer work without coaching. Note the first point where they need help, the wording they misunderstand, and any errors they see. A working export after assistance does not count as an independent completion.

## Feedback

Use [the beta feedback form](https://github.com/pvj7000/map-dots/issues/new?template=beta-feedback.yml). Ask for the integration, completion time, first confusing step, and any browser or installation errors. Include package version `0.1.0-beta.1` or the artifact's commit SHA.

Capture these outcomes for each trial:

| Trial | Developer | Completed without help | Time to embed | First obstacle |
| --- | --- | --- | --- | --- |
| HTML | Pending | Pending | Pending | Pending |
| React | Pending | Pending | Pending | Pending |
| Preset reuse | Pending | Pending | Pending | Pending |

Resolve blockers that prevent a successful embed first. Use the remaining feedback to decide whether the next release needs clearer onboarding, integration fixes, or additional map features.
