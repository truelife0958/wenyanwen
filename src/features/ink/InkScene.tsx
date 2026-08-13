/** 全站 3D 水墨粒子背景 (three.js)。
 *  - three 动态 import 懒加载 (独立 chunk, 主包不含 three)
 *  - WebGL 不可用 → 2D CSS 墨韵背景 (.ink-fallback), 功能不退化
 *  - 性能分级: 桌面 ~1500 粒子 / 移动 ~450; DPR 上限 2; 页面隐藏暂停 rAF
 *  - App.tsx 挂载一次作为全局背景 (不随路由卸载); 讲解模式可再挂一层叠加 */
import { useEffect, useRef } from 'react';
import './ink.css';

export function webglOK(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

const isMobile = typeof window !== 'undefined' &&
  (window.matchMedia?.('(max-width: 768px)').matches || navigator.maxTouchPoints > 1);

/** 水墨粒子渲染器 (命令式, 脱离 React 生命周期) */
class InkRenderer {
  private canvas: HTMLCanvasElement;
  private THREE: any;
  private scene: any;
  private camera: any;
  private renderer: any;
  private points: any[] = [];
  private raf = 0;
  private running = false;
  private clock: any;
  private burstPts: any = null;
  private burstLife = 0;
  private cleanup: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, THREE: any) {
    this.canvas = canvas;
    this.THREE = THREE;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    this.camera.position.z = 60;
    this.renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: false,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.clock = new THREE.Clock();

    const palette = [0xc9a45c, 0x4a8f84, 0xece4d2, 0x8a7440];
    const count = isMobile ? 450 : 1500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      color.setHex(palette[i % palette.length]);
      col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.1, transparent: true, opacity: 0.5, vertexColors: true,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    this.points.push({ mesh: pts, geo, speed: 0.08, phase: Math.random() * Math.PI * 2 });

    const onResize = () => this.resize();
    const onVis = () => {
      if (document.hidden) this.stop(); else this.start();
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    this.cleanup.push(() => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    });
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this.running || !this.renderer) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const t = this.clock.getElapsedTime();
      const p = this.points[0];
      if (p) {
        const attr = p.geo.attributes.position;
        const arr = attr.array;
        for (let i = 0; i < arr.length; i += 3) {
          arr[i + 1] += Math.sin(t * p.speed + i) * 0.006;
          arr[i] += Math.cos(t * p.speed * 0.7 + i * 0.5) * 0.004;
        }
        attr.needsUpdate = true;
        p.mesh.rotation.z = Math.sin(t * 0.05 + p.phase) * 0.06;
        p.mesh.rotation.y = Math.cos(t * 0.04 + p.phase) * 0.1;
      }
      this.camera.position.z = 60 + Math.sin(t * 0.3) * 2;
      this.camera.position.x = Math.sin(t * 0.1) * 2;
      this.updateBurst(t);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** 粒子扩散特效: 中心金点向四周扩散 (内容卡出现时) */
  burst() {
    if (isMobile) return;
    const T = this.THREE;
    if (!T || !this.scene) return;
    const N = 40;
    const geo = new T.BufferGeometry();
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const r = 0.6 + Math.random() * 1.4;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = 0;
    }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const mat = new T.PointsMaterial({ color: 0xe6d2a0, size: 1.2, transparent: true, opacity: 0.9 });
    const pts = new T.Points(geo, mat);
    this.scene.add(pts);
    this.burstPts = { mesh: pts, geo, mat, life: 0 };
  }

  private updateBurst(_t: number) {
    if (!this.burstPts) return;
    const { mesh, geo, mat } = this.burstPts;
    this.burstLife += 0.035;
    const arr = (geo.attributes.position as any).array;
    const m = 1 + this.burstLife * 1.6;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] *= m; arr[i + 1] *= m;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = Math.max(0, 1 - this.burstLife * 2);
    if (this.burstLife > 1) {
      this.scene.remove(mesh);
      geo.dispose(); mat.dispose();
      this.burstPts = null;
      this.burstLife = 0;
    }
  }

  dispose() {
    this.stop();
    this.cleanup.forEach((fn) => fn());
    this.points.forEach((p) => { p.geo.dispose(); (p.mesh.material as any).dispose(); });
    this.scene?.traverse?.((o: any) => { if (o.geometry) o.geometry.dispose(); });
    this.renderer?.dispose();
  }
}

// module 级当前渲染器引用 (供 burst 特效外部调用)
let active: InkRenderer | null = null;
export function inkBurst() { active?.burst(); }

/** 水墨粒子背景组件 */
export default function InkScene() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (!webglOK()) {
      wrap.classList.add('ink-fallback');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'ink-canvas';
    wrap.appendChild(canvas);
    wrap.classList.add('ink-3d');

    let cancelled = false;
    let renderer: InkRenderer | null = null;

    (async () => {
      const THREE = await import('three');
      if (cancelled || !wrap.isConnected) { canvas.remove(); return; }
      renderer = new InkRenderer(canvas, THREE);
      active = renderer;
      requestAnimationFrame(() => { renderer!.resize(); renderer!.start(); });
    })();

    return () => {
      cancelled = true;
      if (active === renderer) active = null;
      renderer?.dispose();
      canvas.remove();
    };
  }, []);

  return <div className="ink-scene" ref={wrapRef} aria-hidden="true" data-testid="ink-scene" />;
}
