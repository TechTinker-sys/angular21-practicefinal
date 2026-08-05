
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
      "chunk-UK4VMYX3.js"
    ],
    "route": "/home"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-UZBEKMPG.js"
    ],
    "route": "/playground"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-BUY73AL3.js"
    ],
    "route": "/about"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-W7RDEJIJ.js"
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
    'index.csr.html': {size: 22002, hash: '8d8792ede6dcf28025ca5ec9e06dfbe7ecc545de5a33886bd8478f30ffdd8719', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 12375, hash: 'afee22864f0ab0fe84c2cf8c04ef47fa496aea3fc0cfd4e9e5e0c0e2a619d938', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 45095, hash: '405d8318d53767e1d6cdf8248ecf1d0f606d525b01839fe14b9f9b8b5878f86a', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'about/index.html': {size: 40343, hash: '99fc4abae53d484e977e69c17a34a4d01b86c9938c824f92f331db868f47a75f', text: () => import('./assets-chunks/about_index_html.mjs').then(m => m.default)},
    'playground/index.html': {size: 50119, hash: '270be7600c0f0bcf7f7a588abd5383fd4e467f66304ab0af1f170958371c0a74', text: () => import('./assets-chunks/playground_index_html.mjs').then(m => m.default)},
    '404/index.html': {size: 37400, hash: '9d87ed5abf492582526901fed07edc89df582b169d3bdf98436711de58d1e4df', text: () => import('./assets-chunks/404_index_html.mjs').then(m => m.default)},
    'styles-DLSU3W3P.css': {size: 36356, hash: '/OX44lcLcf0', text: () => import('./assets-chunks/styles-DLSU3W3P_css.mjs').then(m => m.default)}
  },
};
