# Standee mascot animation asset

Created with the built-in imagegen tool. The reference is `assets/menu/mascot-fullbody-v3.png`; the selected atlas is saved as `assets/menu/mascot-standee-poses-v1.png`.

The transparent atlas has three columns and two rows. Read left to right, then top to bottom: idle, blink, wave inward, wave outward, cheer, joyful blink. `css/standee.css` and `css/menu-effects.css` present the six frames in a 12-second loop. The shared loader `js/mascot-atlas.js` keeps the original mascot visible until the atlas loads in both the standee and interactive Main Menu.

## Generation prompt

Use case: precise-object-edit. Asset type: a single production game mascot animation sprite atlas on a genuinely transparent background. Input image 1 is the edit target and strict identity reference: preserve the same full-body lime-green earth/sprout mascot, cream irregular face, round dark brown eyes, pink cheeks, glossy 3D toy shading, two green leaves on the stem, stubby green hands and feet. Create ONE 1536x1024 transparent PNG sprite sheet laid out in exactly 3 columns and 2 rows of equal 512x512 cells, no gutters or drawn grid. Six frames, read left to right then top to bottom. Every cell contains exactly one full-body mascot, same body size, camera, face placement, feet baseline, and center alignment; all anatomy stays inside the cell with 35px transparent margins. Frame 0 (top-left): friendly default eyes open, mouth smiling, right hand raised as in reference. Frame 1 (top-center): identical default pose except both eyes gently CLOSED in a happy blink; do not change the body. Frame 2 (top-right): eyes open, raised right hand leans slightly inward for a greeting wave. Frame 3 (bottom-left): eyes open, raised right hand leans slightly outward for the other wave position. Frame 4 (bottom-center): cheerful eyes open and both hands raised beside the head, smiling wider, feet at same baseline. Frame 5 (bottom-right): joyful eyes closed as crescents, both hands up, wide happy mouth; same body scale and baseline. Frames are for a timed animated booth display: identity consistency and exact equal-cell alignment are essential. Background completely transparent RGBA, no baked shadows beneath feet, no stars, no glow, no leaves apart from the character's sprout, no floor, no text, no labels, no watermark. Keep original character identity and rendering quality. Do not redesign the mascot or add clothing or props.

## Wave correction prompt

undefined
