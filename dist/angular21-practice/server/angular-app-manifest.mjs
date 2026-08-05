
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
      "chunk-5ZQVBPJM.js"
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
    'index.csr.html': {size: 21754, hash: '3648de8e2639d66f60fd6de3c4e68f0b4be212503e3c58b7ddc3f970cc6ef7b0', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 12488, hash: '93c54353a2337b07578cad25bb0b6ea82f2e87a02270bb028bd1ca2fac5d2c45', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    '404/index.html': {size: 37144, hash: 'd2db68464aba32416dc635967a817e6cf8c6df5a8160dd559a8f6460f7c7cb8f', text: () => import('./assets-chunks/404_index_html.mjs').then(m => m.default)},
    'playground/index.html': {size: 49442, hash: '6ed6776a2ed48060c1342a640eaa0807aa26dacb54ed6a352e0c083e707a9ceb', text: () => import('./assets-chunks/playground_index_html.mjs').then(m => m.default)},
    'about/index.html': {size: 40116, hash: 'e04bda0aeae51bf99888faba61bc2f2829b083ff9bffa4f7e008d35ce96c346d', text: () => import('./assets-chunks/about_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 44861, hash: 'c21ee9dc807df120722f1e16700458b58d09f483b287dcb6e8de74bacbc6a4a2', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'styles-25WT3H3L.css': {size: 35189, hash: 'Yi9gCrtwqiE', text: () => import('./assets-chunks/styles-25WT3H3L_css.mjs').then(m => m.default)}
  },
};
