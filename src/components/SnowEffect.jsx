import { useEffect } from 'react';

const SnowEffect = () => {
  useEffect(() => {
    const CONFIG = {
      count: 120,
      color: "#fff",
      minSize: 1,
      maxSize: 4,
      minDuration: 8,
      maxDuration: 16,
      opacity: 0.8,
      wind: 40,
      zIndex: 9999,
    };

    let container, styleEl, snowflakes = [];

    function createStyle() {
      styleEl = document.createElement("style");
      styleEl.textContent = `
        #snow-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: ${CONFIG.zIndex};
        }
        .snowflake {
          position: absolute;
          top: -10px;
          border-radius: 50%;
          will-change: transform;
          animation-name: snow-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes snow-fall {
          to {
            transform: translate3d(var(--x), 110vh, 0);
          }
        }
      `;
      document.head.appendChild(styleEl);
    }

    function createContainer() {
      container = document.createElement("div");
      container.id = "snow-container";
      document.body.appendChild(container);
    }

    function createSnowflake() {
      const el = document.createElement("div");
      const size = rand(CONFIG.minSize, CONFIG.maxSize);
      const duration = rand(CONFIG.minDuration, CONFIG.maxDuration);
      const startX = rand(0, window.innerWidth);
      const drift = rand(-CONFIG.wind, CONFIG.wind);

      el.className = "snowflake";
      el.style.width = el.style.height = `${size}px`;
      el.style.left = `${startX}px`;
      el.style.opacity = CONFIG.opacity;
      el.style.background = CONFIG.color;
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `-${Math.random() * duration}s`;
      el.style.setProperty("--x", `${drift}px`);

      container.appendChild(el);
      snowflakes.push(el);
    }

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function start() {
      if (container) return;
      createStyle();
      createContainer();
      for (let i = 0; i < CONFIG.count; i++) createSnowflake();
    }

    function stop() {
      snowflakes.forEach(el => el.remove());
      snowflakes = [];
      container?.remove();
      styleEl?.remove();
      container = styleEl = null;
    }

    function onResize() {
      snowflakes.forEach(el => {
        el.style.left = rand(0, window.innerWidth) + "px";
      });
    }

    window.addEventListener("resize", onResize);

    // Start the snow effect
    start();

    // Cleanup function
    return () => {
      window.removeEventListener("resize", onResize);
      stop();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default SnowEffect;

