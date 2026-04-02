/// <reference types="vite/client" />

// Allow CSS side-effect imports (e.g., swiper/css)
declare module 'swiper/css' {
  const css: string
  export default css
}
