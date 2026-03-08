import{j as a}from"./jsx-runtime-D_zvdyIk.js";const P="_button_1eg57_2",E="_primary_1eg57_24",I="_secondary_1eg57_39",z="_ghost_1eg57_53",C="_danger_1eg57_64",L="_sm_1eg57_76",O="_md_1eg57_82",U="_lg_1eg57_88",W="_glow_1eg57_95",A="_buttonGlow_1eg57_1",F="_loading_1eg57_109",H="_content_1eg57_109",J="_spinner_1eg57_113",K="_spin_1eg57_113",M="_icon_1eg57_135",e={button:P,primary:E,secondary:I,ghost:z,danger:C,sm:L,md:O,lg:U,glow:W,buttonGlow:A,loading:F,content:H,spinner:J,spin:K,icon:M};function j({variant:D="primary",size:R="md",glow:S=!1,loading:r=!1,icon:n,iconPosition:i="left",children:q,className:G="",disabled:T,...V}){const k=[e.button,e[D],e[R],S&&e.glow,r&&e.loading,G].filter(Boolean).join(" ");return a.jsxs("button",{className:k,disabled:T||r,...V,children:[r&&a.jsx("span",{className:e.spinner,children:a.jsx("svg",{viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:a.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round",strokeDasharray:"31.4 31.4"})})}),!r&&n&&i==="left"&&a.jsx("span",{className:e.icon,children:n}),a.jsx("span",{className:e.content,children:q}),!r&&n&&i==="right"&&a.jsx("span",{className:e.icon,children:n})]})}j.__docgenInfo={description:"",methods:[],displayName:"Button",props:{variant:{required:!1,tsType:{name:"union",raw:"'primary' | 'secondary' | 'ghost' | 'danger'",elements:[{name:"literal",value:"'primary'"},{name:"literal",value:"'secondary'"},{name:"literal",value:"'ghost'"},{name:"literal",value:"'danger'"}]},description:"",defaultValue:{value:"'primary'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'sm' | 'md' | 'lg'",elements:[{name:"literal",value:"'sm'"},{name:"literal",value:"'md'"},{name:"literal",value:"'lg'"}]},description:"",defaultValue:{value:"'md'",computed:!1}},glow:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},loading:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},iconPosition:{required:!1,tsType:{name:"union",raw:"'left' | 'right'",elements:[{name:"literal",value:"'left'"},{name:"literal",value:"'right'"}]},description:"",defaultValue:{value:"'left'",computed:!1}},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},className:{defaultValue:{value:"''",computed:!1},required:!1}}};const X={title:"UI/Button",component:j,tags:["autodocs"]},s={args:{variant:"primary",children:"Primary Button"}},t={args:{variant:"secondary",children:"Secondary Button"}},o={args:{variant:"ghost",children:"Ghost Button"}},l={args:{variant:"danger",children:"Danger Button"}},c={args:{disabled:!0,children:"Disabled Button"}};var d,u,m;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
}`,...(m=(u=s.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var p,g,_;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
}`,...(_=(g=t.parameters)==null?void 0:g.docs)==null?void 0:_.source}}};var y,f,h;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
}`,...(h=(f=o.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var v,w,b;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Danger Button'
  }
}`,...(b=(w=l.parameters)==null?void 0:w.docs)==null?void 0:b.source}}};var B,x,N;c.parameters={...c.parameters,docs:{...(B=c.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
}`,...(N=(x=c.parameters)==null?void 0:x.docs)==null?void 0:N.source}}};const Y=["Primary","Secondary","Ghost","Danger","Disabled"];export{l as Danger,c as Disabled,o as Ghost,s as Primary,t as Secondary,Y as __namedExportsOrder,X as default};
