import * as THREE from 'three';

// Where the full-size house interior lives in the world (far away from everything else)
export const ROOM_ORIGIN = [0, -200, 0];

// Camera spot right in front of the little house's front window, in globe-local space.
// Must match the house transform in Scenery.jsx: position [0.85,-1.75,0.35], rotY -0.35, scale 0.85
function windowStop() {
  const house = new THREE.Matrix4().compose(
    new THREE.Vector3(0.85, -1.75, 0.35),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.35),
    new THREE.Vector3(0.85, 0.85, 0.85)
  );
  const look = new THREE.Vector3(-0.14, 0.33, 0.377).applyMatrix4(house);
  const pos = new THREE.Vector3(-0.14, 0.36, 0.85).applyMatrix4(house);
  return { pos: pos.toArray(), look: look.toArray() };
}

const ENTER = { space: 'globe', pos: [0, -0.5, 1.95], look: [0.1, -1.3, 0] };
const TREE = { space: 'globe', pos: [0.35, -0.85, 1.0], look: [-0.5, -0.8, -0.3] };
const LOOKOUT = { space: 'globe', pos: [0.2, -1.1, 0.6], look: [0, 0.5, -10] };
const ROOM_ENTER = { space: 'room', pos: [0, 1.7, 2.7], look: [0, 1.1, -1.5] };
const FIRE = { space: 'room', pos: [0.9, 1.4, 0.2], look: [2.4, 0.8, -2.6] };
const TABLE = { space: 'room', pos: [0.6, 1.8, 1.3], look: [-0.2, 0.9, -1.0] };
const ROOM_TREE = { space: 'room', pos: [-1.0, 1.4, 0.5], look: [-2.8, 1.2, -2.4] };

const BLOW_HINT = 'Blow on your mic and watch the glass fog up around you!';

export function getTourStops(era) {
  if (era === 'future') {
    return [
      { ...ENTER, title: 'You shrank!', caption: `You're inside the snow globe now. ${BLOW_HINT}` },
      { ...TREE, title: 'The Hologram Tree', caption: 'No needles to sweep up in 2125. This tree is pure light.' },
      {
        space: 'globe',
        pos: [0.9, -0.95, 1.7],
        look: [0.15, -1.15, 1.15],
        title: 'Delivery Drone',
        caption: "Santa's sleigh got an upgrade. This drone drops presents straight down chimneys that don't exist anymore.",
      },
      { ...LOOKOUT, title: 'Look Out', caption: 'Turn on "Let it Snow" and see the town of the future through the glass.' },
    ];
  }

  const past = era === 'past';
  return [
    { ...ENTER, title: 'You shrank!', caption: `You're inside the snow globe now. ${BLOW_HINT}` },
    {
      ...TREE,
      title: 'The Tree',
      caption: past
        ? 'A Victorian tree, lit with real little candles and strung with popcorn garlands.'
        : 'Twinkling lights, gold tinsel and a pile of presents just waiting to be opened.',
    },
    {
      space: 'globe',
      ...windowStop(),
      title: 'Peek Through the Window',
      caption: past
        ? 'Something smells wonderful… the family is gathering for Christmas dinner.'
        : 'Wrapping paper everywhere! Shall we go in?',
    },
    {
      ...ROOM_ENTER,
      title: 'Come In From the Cold',
      caption: past
        ? 'Candlelight, woodsmoke and roast turkey. Welcome to Christmas long ago.'
        : 'Music, laughter, and the dog chasing ribbons around the room.',
    },
    {
      ...FIRE,
      title: 'By the Fire',
      caption: past
        ? 'Grandma rocks by the crackling fire, knitting one last scarf before morning.'
        : 'Grandpa has dozed off by the fire. The dog is keeping him company.',
    },
    {
      ...TABLE,
      title: 'The Feast',
      caption: past
        ? 'Father carves the turkey while Uncle raises a toast: "God bless us, every one!"'
        : 'Mum lays out the plates while Dad tries to get everyone into one photo.',
    },
    {
      ...ROOM_TREE,
      title: 'Round the Tree',
      caption: past
        ? 'The little ones hang paper ornaments and cannot stop dancing.'
        : 'Someone just found the biggest present under the tree!',
    },
    { ...LOOKOUT, title: 'Look Out', caption: 'Back in the globe. Look out through the glass at the world beyond.' },
  ];
}
