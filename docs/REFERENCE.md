# The look we used

[The source video by Satya](https://x.com/heysatya_/status/2110320521191813475?s=20) was viewed in the browser on 16 October 2026.

Seen in the video:
- A dark phone wallet.
- One large card with a metal-like sheen.
- A card tilted in space, with light moving over its face.
- Round icons below it to pick a card.
- The card and title change when another icon is picked.
- A list of recent use below the card.

Made for this app:
- Gold, silver, and bronze club cards.
- Club names and member roles in place of bank names and payment data.
- A back view with a QR code.
- A desktop side menu and details panel.
- Club office tools, invites, live checks, and card revocation.

This is an adaptation. It is not a pixel-for-pixel copy. We could view the video, but could not use its source app or measure its timing. Touch uses clear tap buttons and keeps page scrolling free. Phone tilt is not part of this first build.

## UI Skills

The user asked for skills from [UI Skills](https://www.ui-skills.com/). Its source is [ibelick/ui-skills](https://github.com/ibelick/ui-skills).

Installed and read:
- baseline-ui
- fixing-accessibility
- fixing-motion-performance

Applied to accessible dialogs, focus, reduced motion, small touch targets, card transforms, and spacing. Metal gradients and card movement are kept because the brief asks for them.

## Card-first revision

The user asked to remove the wallet intro, year, and demo toolbar; enlarge the main line and card; and add a real right-to-left flip. The `animate` skill from `emilkowalski/skills` was installed and read. The flip uses its spring preset with persistent front and back faces, transform-only motion, reduced-motion support, and interruptible transitions. The skill is guidance, not a prebuilt flip component.

Demo administration moved to Profile. Vibration is best-effort via the browser API and is not available in iPhone Safari. This build makes no claim of native iPhone haptic support.
