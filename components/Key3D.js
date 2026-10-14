"use client";
// The hero's 3D object: one glass Enter keycap with a black play arrow inside it, floating on a halftone cloud. Drag tilts it; when a
// game starts, it presses down like a real key (press() through the ref). Pauses while off screen; a still under reduced
// motion. three.js is loaded only here, on the client.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const Key3D = forwardRef(function Key3D({ className = "" }, ref) {
  const host = useRef(null), api = useRef({ press() {} });
  useImperativeHandle(ref, () => ({ press: () => api.current.press() }), []);

  useEffect(() => {
    let alive = true, raf = 0, cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      const { studioEnvironment, whiteGlass } = await import("./studio.js");
      if (!alive || !host.current) return;
      const el = host.current;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.environment = studioEnvironment(THREE, renderer);
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, 4.4, 7.4);
      camera.lookAt(0, -0.05, 0);

      // the key: one sculpted glass keycap (a rounded box whose top tapers in, like a real cap) with an inked play arrow
      // floating inside it, seen through the glass
      const white = whiteGlass(THREE);
      const ink = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.35, clearcoat: 0.7 });
      const body = new RoundedBoxGeometry(2.5, 1.05, 2.5, 6, 0.22);
      const pos = body.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const t = (pos.getY(i) + 0.525) / 1.05, k = 1 - 0.2 * t;
        pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k);
      }
      body.computeVertexNormals();
      const key = new THREE.Group();
      const top = key;
      const cap = new THREE.Mesh(body, white);
      const tri = new THREE.Shape();
      tri.moveTo(-0.34, -0.42); tri.lineTo(0.5, 0); tri.lineTo(-0.34, 0.42); tri.closePath();
      const arrow = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.03, bevelSegments: 2 }), ink);
      arrow.rotation.x = -Math.PI / 2;
      arrow.position.set(0.05, 0.535, 0);
      arrow.scale.set(1.2, 1.2, 1);
      key.add(cap, arrow);
      const pivot = new THREE.Group();
      pivot.add(key);
      scene.add(pivot);
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(3, 6, 4);
      scene.add(sun, new THREE.AmbientLight(0xffffff, 0.25));
      // a soft contact shadow under the key
      const sh = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = -0.62; sh.scale.set(1.05, 1.05, 1);
      scene.add(sh);

      const size = () => {
        const w = el.clientWidth || 1, h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w / h < 0.9 ? 38 : 30;
        camera.updateProjectionMatrix();
      };
      size();
      const ro = new ResizeObserver(size); ro.observe(el);

      // drag to tilt; it eases back when let go
      let drag = null, tx = 0, ty = 0.65, rx = tx, ry = ty, pressT = -1, visible = true;
      const down = (e) => { drag = { x: e.clientX, y: e.clientY, tx, ty }; el.setPointerCapture?.(e.pointerId); };
      const move = (e) => { if (!drag) return; ty = drag.ty + (e.clientX - drag.x) * 0.008; tx = Math.max(-0.9, Math.min(0.5, drag.tx + (e.clientY - drag.y) * 0.006)); };
      const up = () => { drag = null; };
      el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
      const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) loop(); }); io.observe(el);
      api.current.press = () => { pressT = 0; };

      const clock = new THREE.Clock();
      const loop = () => {
        raf = 0;
        if (!alive || !visible) return;
        const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
        if (!drag && !reduce) { ty += dt * 0.25; tx += (0 - tx) * dt * 1.2; }
        rx += (tx - rx) * Math.min(1, dt * 6); ry += (ty - ry) * Math.min(1, dt * 6);
        pivot.rotation.set(rx * 0.45, ry, 0);
        pivot.position.y = reduce ? 0 : Math.sin(t * 1.3) * 0.08;
        sh.material.opacity = 0.4 - pivot.position.y * 0.6;
        // the press: down fast, a little bounce, back up
        if (pressT >= 0) {
          pressT += dt;
          const p = pressT < 0.09 ? pressT / 0.09 : pressT < 0.5 ? 1 - (pressT - 0.09) / 0.41 : 0;
          key.position.y = -0.32 * Math.max(0, p);
          if (pressT > 0.6) { pressT = -1; key.position.y = 0; }
        }
        renderer.render(scene, camera);
        if (!reduce || drag || pressT >= 0) raf = requestAnimationFrame(loop);
      };
      loop();
      // under reduced motion one frame is drawn, and dragging redraws
      if (reduce) el.addEventListener("pointermove", () => { if (!raf) raf = requestAnimationFrame(loop); });

      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
        el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
        renderer.dispose(); renderer.domElement.remove();
      };
    })();
    return () => { alive = false; cleanup(); };
  }, []);

  return <div ref={host} className={`key3d ${className}`} aria-hidden="true" />;
});

export default Key3D;
