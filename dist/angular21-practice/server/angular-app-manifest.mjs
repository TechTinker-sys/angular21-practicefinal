
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
      "chunk-JYRTK5UN.js"
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
    'index.csr.html': {size: 21734, hash: 'c7f1e9db07129d3a0fca7de6cc0e290e1276c584ee1450c3a1dfbdedd64a33dc', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 12488, hash: '9d8d617c6c56873d76c506a14ccd11114fb3f6420d8defcd26bf7dff21759a45', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    '404/index.html': {size: 37123, hash: '86cda0d77dd2ff00ab7f550b9f956c0c4c3066fcc44879c64a3ef8dd4cd8e8f6', text: () => import('./assets-chunks/404_index_html.mjs').then(m => m.default)},
    'about/index.html': {size: 40095, hash: 'b7ca317064ecbb5d86c20d8b8b7a6961ecddb986a5a1dc07fe9ce0012f6cabf3', text: () => import('./assets-chunks/about_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 44840, hash: '1362dd344b0f0be3b31079a708b3da0f3f2fc799c25eb7f815231be26a037baa', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'playground/index.html': {size: 49392, hash: 'f2388799f7b649df543093f0a121220e5e2ede42eb54633952a0d6a6c6181533', text: () => import('./assets-chunks/playground_index_html.mjs').then(m => m.default)},
    'styles-OTMY54ZZ.css': {size: 35082, hash: 'NWwwjWZwPhY', text: () => import('./assets-chunks/styles-OTMY54ZZ_css.mjs').then(m => m.default)}
  },
};
