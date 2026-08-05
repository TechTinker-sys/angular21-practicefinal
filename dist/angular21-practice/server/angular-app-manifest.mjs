
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/home",
    "route": "/"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-JEXQJ5DM.js"
    ],
    "route": "/home"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-JO6YXAYS.js"
    ],
    "route": "/playground"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-MO6YLLYV.js"
    ],
    "route": "/about"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-ATR2MDRE.js"
    ],
    "route": "/404"
  },
  {
    "renderMode": 2,
    "redirectTo": "/404",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 21754, hash: 'bbadd6e11904b8ba0647afde3165879b0f5fe3e26d6162794c9c2f92709bb691', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 12488, hash: '949a33238e28bbcd03e56eff1a456094c033f781c03aadb221db4cf5910df7d4', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 44861, hash: '420b32b221a075c45414825aab46cccd2f19d1d96fc77e2c60181c71eb118d2c', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'about/index.html': {size: 40116, hash: 'a0c6ef6ffa951e06e74b3bbbfbe15454ee8b75903ab44b056fc78e944bf0609c', text: () => import('./assets-chunks/about_index_html.mjs').then(m => m.default)},
    '404/index.html': {size: 37144, hash: '30b54f3cb78165c53b912b320f0be5ec26ff8510818814bad8c157e1762c44ff', text: () => import('./assets-chunks/404_index_html.mjs').then(m => m.default)},
    'playground/index.html': {size: 49442, hash: 'f78e889805915e73cfa9f45ef93bfd65c7bc085a02ba1e7ec08be46c01d3cb5d', text: () => import('./assets-chunks/playground_index_html.mjs').then(m => m.default)},
    'styles-VHVLIHHM.css': {size: 35146, hash: 'xur+5GoOTeo', text: () => import('./assets-chunks/styles-VHVLIHHM_css.mjs').then(m => m.default)}
  },
};
