import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

export const StaggeredMenu = ({
  colors = ['#1e1e22', '#35353c'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  accentColor = '#3b82f6',
  changeMenuColorOnOpen = true,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
  headerRight = null,
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef(null);
  const preLayersRef = useRef(null);
  const preLayerElsRef = useRef([]);
  const plusHRef = useRef(null);
  const plusVRef = useRef(null);
  const iconRef = useRef(null);
  const textInnerRef = useRef(null);
  const textWrapRef = useRef(null);
  const [textLines, setTextLines] = useState(['Menu', 'Close']);

  const openTlRef = useRef(null);
  const closeTweenRef = useRef(null);
  const spinTweenRef = useRef(null);
  const textCycleAnimRef = useRef(null);
  const colorTweenRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const busyRef = useRef(false);
  const itemEntranceTweenRef = useRef(null);

  // Panel always slides from the left (xPercent: -100 → 0)
  const OFFSCREEN = -100;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer'));
      }
      preLayerElsRef.current = preLayers;

      gsap.set([panel, ...preLayers], { xPercent: OFFSCREEN, opacity: 1 });
      if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const layerStates = layers.map(el => ({ el, start: OFFSCREEN }));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 60, opacity: 0 });
    if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 15, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.45, ease: 'power4.out' }, i * 0.06);
    });

    const panelInsertTime = layerStates.length ? (layerStates.length - 1) * 0.06 + 0.06 : 0;
    tl.fromTo(panel, { xPercent: OFFSCREEN }, { xPercent: 0, duration: 0.55, ease: 'power4.out' }, panelInsertTime);

    if (itemEls.length) {
      tl.to(itemEls, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.05 }, panelInsertTime + 0.12);
      if (numberEls.length) {
        tl.to(numberEls, { duration: 0.4, ease: 'power2.out', '--sm-num-opacity': 1, stagger: 0.04 }, panelInsertTime + 0.18);
      }
    }

    if (socialTitle || socialLinks.length) {
      const sStart = panelInsertTime + 0.3;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.4, ease: 'power2.out' }, sStart);
      if (socialLinks.length) tl.to(socialLinks, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.05 }, sStart + 0.04);
    }

    openTlRef.current = tl;
    return tl;
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => { busyRef.current = false; });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    itemEntranceTweenRef.current?.kill();
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: OFFSCREEN,
      duration: 0.28,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => { busyRef.current = false; }
    });
  }, []);

  const animateIcon = useCallback(opening => {
    spinTweenRef.current?.kill();
    if (!iconRef.current) return;
    spinTweenRef.current = gsap.to(iconRef.current, {
      rotate: opening ? 225 : 0,
      duration: opening ? 0.8 : 0.35,
      ease: opening ? 'power4.out' : 'power3.inOut',
      overwrite: 'auto'
    });
  }, []);

  const animateColor = useCallback(opening => {
    if (!toggleBtnRef.current) return;
    colorTweenRef.current?.kill();
    if (changeMenuColorOnOpen) {
      colorTweenRef.current = gsap.to(toggleBtnRef.current, {
        color: opening ? openMenuButtonColor : menuButtonColor,
        delay: 0.15, duration: 0.3, ease: 'power2.out'
      });
    }
  }, [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]);

  const animateText = useCallback(opening => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const seq = [currentLabel, targetLabel === 'Menu' ? 'Close' : 'Menu', targetLabel, targetLabel];
    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -((seq.length - 1) / seq.length) * 100,
      duration: 0.4 + seq.length * 0.06,
      ease: 'power4.out'
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) { onMenuOpen?.(); playOpen(); }
    else { onMenuClose?.(); playClose(); }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    onMenuClose?.();
    playClose();
    animateIcon(false);
    animateColor(false);
    animateText(false);
  }, [playClose, animateIcon, animateColor, animateText, onMenuClose]);

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          toggleBtnRef.current && !toggleBtnRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeOnClickAway, open, closeMenu]);

  // Build color layers (max 3, remove middle if >= 3)
  const colorLayers = (() => {
    const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
    let arr = [...raw];
    if (arr.length >= 3) arr.splice(Math.floor(arr.length / 2), 1);
    return arr;
  })();

  const toggleButton = (
    <button
      ref={toggleBtnRef}
      className="sm-toggle"
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls="staggered-menu-panel"
      onClick={toggleMenu}
      type="button"
    >
      <span ref={textWrapRef} className="sm-toggle-textWrap" aria-hidden="true">
        <span ref={textInnerRef} className="sm-toggle-textInner">
          {textLines.map((l, i) => <span className="sm-toggle-line" key={i}>{l}</span>)}
        </span>
      </span>
      <span ref={iconRef} className="sm-icon" aria-hidden="true">
        <span ref={plusHRef} className="sm-icon-line" />
        <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
      </span>
    </button>
  );

  return (
    <div
      className={'staggered-menu-wrapper fixed-wrapper' + (className ? ' ' + className : '')}
      style={accentColor ? { ['--sm-accent']: accentColor } : undefined}
      data-open={open || undefined}
    >
      {/* Pre-layers for sweep animation */}
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {colorLayers.map((c, i) => <div key={i} className="sm-prelayer" style={{ background: c }} />)}
      </div>

      {/* Header — replaces the old TopBar */}
      <header className="staggered-menu-header" aria-label="Main navigation">
        {/* Toggle button always on the LEFT */}
        {toggleButton}
        {/* Right-side content (search, bell, rep) */}
        {headerRight && <div className="sm-header-right">{headerRight}</div>}
      </header>

      {/* Navigation panel — slides in from left */}
      <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel" aria-hidden={!open}>
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
            {items && items.length ? items.map((it, idx) => (
              <li className="sm-panel-itemWrap" key={it.label + idx}>
                <a
                  className="sm-panel-item"
                  href={it.link}
                  aria-label={it.ariaLabel}
                  data-index={idx + 1}
                  onClick={e => { if (it.onClick) { e.preventDefault(); it.onClick(); closeMenu(); } }}
                >
                  <span className="sm-panel-itemLabel">{it.label}</span>
                </a>
              </li>
            )) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item"><span className="sm-panel-itemLabel">No items</span></span>
              </li>
            )}
          </ul>

          {displaySocials && socialItems && socialItems.length > 0 && (
            <div className="sm-socials" aria-label="Social links">
              <h3 className="sm-socials-title">Connect</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((s, i) => (
                  <li key={s.label + i} className="sm-socials-item">
                    <a href={s.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">{s.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;
