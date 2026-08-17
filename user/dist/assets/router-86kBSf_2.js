import{r as s,u as w,a as T,c as v,l as U,R as b,b as g}from"./vendor-DVgmK9M0.js";import"./react-dom-DHMH2zO3.js";/**
 * React Router DOM v6.30.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function f(e){return e===void 0&&(e=""),new URLSearchParams(typeof e=="string"||Array.isArray(e)||e instanceof URLSearchParams?e:Object.keys(e).reduce((c,t)=>{let r=e[t];return c.concat(Array.isArray(r)?r.map(a=>[t,a]):[[t,r]])},[]))}function y(e,c){let t=f(e);return c&&c.forEach((r,a)=>{t.has(a)||c.getAll(a).forEach(n=>{t.append(a,n)})}),t}const E="6";try{window.__reactRouterVersion=E}catch{}const F="startTransition",S=g[F];function d(e){let{basename:c,children:t,future:r,window:a}=e,n=s.useRef();n.current==null&&(n.current=v({window:a,v5Compat:!0}));let o=n.current,[u,i]=s.useState({action:o.action,location:o.location}),{v7_startTransition:l}=r||{},h=s.useCallback(m=>{l&&S?S(()=>i(m)):i(m)},[i,l]);return s.useLayoutEffect(()=>o.listen(h),[o,h]),s.useEffect(()=>U(r),[r]),s.createElement(b,{basename:c,children:t,location:u.location,navigationType:u.action,navigator:o,future:r})}var R;(function(e){e.UseScrollRestoration="useScrollRestoration",e.UseSubmit="useSubmit",e.UseSubmitFetcher="useSubmitFetcher",e.UseFetcher="useFetcher",e.useViewTransitionState="useViewTransitionState"})(R||(R={}));var p;(function(e){e.UseFetcher="useFetcher",e.UseFetchers="useFetchers",e.UseScrollRestoration="useScrollRestoration"})(p||(p={}));function _(e){let c=s.useRef(f(e)),t=s.useRef(!1),r=w(),a=s.useMemo(()=>y(r.search,t.current?null:c.current),[r.search]),n=T(),o=s.useCallback((u,i)=>{const l=f(typeof u=="function"?u(a):u);t.current=!0,n("?"+l,i)},[n,a]);return[a,o]}export{d as B,_ as u};
