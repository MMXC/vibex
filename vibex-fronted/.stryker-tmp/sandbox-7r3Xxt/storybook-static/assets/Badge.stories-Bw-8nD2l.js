// @ts-nocheck
import{j as u}from"./jsx-runtime-D_zvdyIk.js";const j="_badge_uuu26_2",R="_sm_uuu26_14",V="_md_uuu26_20",W="_primary_uuu26_33",G="_success_uuu26_39",D="_warning_uuu26_45",I="_error_uuu26_51",z="_info_uuu26_57",O="_glow_uuu26_64",U="_badgeGlow_uuu26_1",k="_dot_uuu26_78",A="_dotPulse_uuu26_1",e={badge:j,sm:R,md:V,default:"_default_uuu26_27",primary:W,success:G,warning:D,error:I,info:z,glow:O,badgeGlow:U,dot:k,dotPulse:A};function S({variant:N="default",size:P="md",glow:q=!1,dot:x=!1,className:B="",children:E}){const T=[e.badge,e[N],e[P],q&&e.glow,B].filter(Boolean).join(" ");return u.jsxs("span",{className:T,children:[x&&u.jsx("span",{className:e.dot}),E]})}S.__docgenInfo={description:"",methods:[],displayName:"Badge",props:{variant:{required:!1,tsType:{name:"union",raw:"'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'",elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'primary'"},{name:"literal",value:"'success'"},{name:"literal",value:"'warning'"},{name:"literal",value:"'error'"},{name:"literal",value:"'info'"}]},description:"",defaultValue:{value:"'default'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'sm' | 'md'",elements:[{name:"literal",value:"'sm'"},{name:"literal",value:"'md'"}]},description:"",defaultValue:{value:"'md'",computed:!1}},glow:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},dot:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const F={title:"UI/Badge",component:S,tags:["autodocs"]},a={args:{children:"Badge"}},r={args:{children:"Primary"}},s={args:{children:"Success"}},n={args:{children:"Warning"}},o={args:{children:"Error"}};var t,c,l;a.parameters={...a.parameters,docs:{...(t=a.parameters)==null?void 0:t.docs,source:{originalSource:`{
  args: {
    children: 'Badge'
  }
}`,...(l=(c=a.parameters)==null?void 0:c.docs)==null?void 0:l.source}}};var d,i,m;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    children: 'Primary'
  }
}`,...(m=(i=r.parameters)==null?void 0:i.docs)==null?void 0:m.source}}};var p,g,_;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    children: 'Success'
  }
}`,...(_=(g=s.parameters)==null?void 0:g.docs)==null?void 0:_.source}}};var f,y,w;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    children: 'Warning'
  }
}`,...(w=(y=n.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};var v,h,b;o.parameters={...o.parameters,docs:{...(v=o.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    children: 'Error'
  }
}`,...(b=(h=o.parameters)==null?void 0:h.docs)==null?void 0:b.source}}};const H=["Default","Primary","Success","Warning","Error"];export{a as Default,o as Error,r as Primary,s as Success,n as Warning,H as __namedExportsOrder,F as default};
