// A product-photo studio as the environment map: a black room with soft light strips. On black, glass only reads as
// glass through crisp highlights and bright edges, which these strips give it. Shared by the hero key and the icon renders.
export function studioEnvironment(THREE, renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const strip = (w, h, x, y, z, rx, ry, k = 1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); scene.add(m);
  };
  strip(12, 4, 0, 7, 0, Math.PI / 2, 0, 5); // the big softbox overhead
  strip(2, 9, -7, 1.5, 2, 0, Math.PI / 2, 4); // a tall strip left
  strip(2, 9, 7, 1.5, -1, 0, -Math.PI / 2, 3.2); // and right
  strip(10, 1, 0, 2.2, -7, 0, 0, 3); // a rim strip behind
  strip(9, 2.4, 0, 0.6, 7, 0, Math.PI, 2); // a low fill in front
  strip(14, 14, 0, -6, 0, -Math.PI / 2, 0, 0.35); // a dim floor bounce
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, 0.02).texture;
  pm.dispose();
  return tex;
}

// frosted glass under a glossy skin: the body scatters the studio light and glows, the clearcoat carries crisp
// highlights, a little dispersion fringes the edges. This is what reads as glass on a black ground.
export function glassMaterial(THREE, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.34, transmission: 1, thickness: 2.4, ior: 1.5, dispersion: 2,
    clearcoat: 1, clearcoatRoughness: 0, attenuationColor: new THREE.Color(0xe9eefc), attenuationDistance: 1.6,
    specularIntensity: 1, envMapIntensity: 2.6, ...opts,
  });
}

// white glass: the brand's look (coin icon, hero key). Mostly what it reflects, lit a little from within so it stays
// white on black, with crisp highlights from the clearcoat.
export function whiteGlass(THREE, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 0.7, thickness: 1.4, roughness: 0.04, ior: 1.52, clearcoat: 1, clearcoatRoughness: 0,
    emissive: new THREE.Color(0xc9ced8), emissiveIntensity: 0.28, attenuationColor: new THREE.Color(0xf6f8fc), attenuationDistance: 2.2,
    envMapIntensity: 3, ...opts,
  });
}
