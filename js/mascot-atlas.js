// Shared by the interactive menu and standee display. Keep the original PNG
// visible until a complete three-column, two-row atlas is ready.
export function loadMascotAtlas(actor, sprite) {
  if (!actor || !sprite) return;
  const atlasUrl = new URL('../assets/menu/mascot-standee-poses-v1.png', import.meta.url);
  const atlas = new Image();
  atlas.onload = () => {
    if (!atlas.naturalWidth || atlas.naturalWidth * 2 !== atlas.naturalHeight * 3) return;
    sprite.style.backgroundImage = `url("${atlasUrl.href}")`;
    actor.classList.add('has-sprite');
  };
  atlas.src = atlasUrl.href;
}
