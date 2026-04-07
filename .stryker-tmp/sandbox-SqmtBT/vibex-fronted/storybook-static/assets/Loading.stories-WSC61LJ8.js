// @ts-nocheck
import{j as e}from"./jsx-runtime-D_zvdyIk.js";const E="_container_8rr3l_1",I="_small_8rr3l_10",O="_medium_8rr3l_14",U="_large_8rr3l_18",k="_text_8rr3l_22",A="_spinner_8rr3l_27",G="_spinnerRing_8rr3l_33",H="_spin_8rr3l_27",J="_dots_8rr3l_66",K="_dot_8rr3l_66",M="_pulse_8rr3l_113",Q="_pulseCore_8rr3l_120",W="_pulseRing_8rr3l_137",X="_fullScreen_8rr3l_174",Y="_overlay_8rr3l_184",Z="_progressContainer_8rr3l_195",ee="_progressBar_8rr3l_202",se="_progressFill_8rr3l_209",re="_progressText_8rr3l_228",s={container:E,small:I,medium:O,large:U,text:k,spinner:A,spinnerRing:G,spin:H,dots:J,dot:K,"dot-pulse":"_dot-pulse_8rr3l_1",pulse:M,pulseCore:Q,pulseRing:W,"pulse-expand":"_pulse-expand_8rr3l_1",fullScreen:X,overlay:Y,progressContainer:Z,progressBar:ee,progressFill:se,progressText:re,"progress-indeterminate":"_progress-indeterminate_8rr3l_1"};function D({text:u,variant:r="spinner",size:P="medium",fullScreen:B=!1,overlay:$=!1,className:b=""}){const p=e.jsxs("div",{className:`${s.container} ${s[P]} ${b}`,children:[e.jsxs("div",{className:s[r],children:[r==="spinner"&&e.jsx("div",{className:s.spinnerRing}),r==="dots"&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:s.dot}),e.jsx("span",{className:s.dot}),e.jsx("span",{className:s.dot})]}),r==="pulse"&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:s.pulseRing}),e.jsx("span",{className:s.pulseCore})]})]}),u&&e.jsx("span",{className:s.text,children:u})]});return B?e.jsx("div",{className:s.fullScreen,children:p}):$?e.jsx("div",{className:s.overlay,children:p}):p}D.__docgenInfo={description:"",methods:[],displayName:"Loading",props:{text:{required:!1,tsType:{name:"string"},description:"加载文案"},variant:{required:!1,tsType:{name:"union",raw:"'spinner' | 'dots' | 'pulse'",elements:[{name:"literal",value:"'spinner'"},{name:"literal",value:"'dots'"},{name:"literal",value:"'pulse'"}]},description:"加载变体: spinner-旋转图标, dots-三点动画, pulse-脉冲",defaultValue:{value:"'spinner'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'small' | 'medium' | 'large'",elements:[{name:"literal",value:"'small'"},{name:"literal",value:"'medium'"},{name:"literal",value:"'large'"}]},description:"尺寸: small, medium, large",defaultValue:{value:"'medium'",computed:!1}},fullScreen:{required:!1,tsType:{name:"boolean"},description:"是否全屏显示",defaultValue:{value:"false",computed:!1}},overlay:{required:!1,tsType:{name:"boolean"},description:"叠加层背景透明度",defaultValue:{value:"false",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"自定义类名",defaultValue:{value:"''",computed:!1}}}};const ne={title:"UI/Loading",component:D,tags:["autodocs"],argTypes:{size:{control:"select",options:["small","medium","large"]},variant:{control:"select",options:["spinner","dots","pulse"]}}},a={args:{text:"Loading..."}},n={args:{variant:"spinner",text:"Loading content..."}},l={args:{variant:"dots",text:"Loading"}},t={args:{variant:"pulse",text:"Please wait"}},o={args:{size:"small",text:"Small loading"}},i={args:{size:"large",text:"Large loading"}},c={args:{fullScreen:!0,text:"Loading full screen"}};var d,m,g;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    text: 'Loading...'
  }
}`,...(g=(m=a.parameters)==null?void 0:m.docs)==null?void 0:g.source}}};var _,x,f;n.parameters={...n.parameters,docs:{...(_=n.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    variant: 'spinner',
    text: 'Loading content...'
  }
}`,...(f=(x=n.parameters)==null?void 0:x.docs)==null?void 0:f.source}}};var v,S,j;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    variant: 'dots',
    text: 'Loading'
  }
}`,...(j=(S=l.parameters)==null?void 0:S.docs)==null?void 0:j.source}}};var L,y,N;t.parameters={...t.parameters,docs:{...(L=t.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    variant: 'pulse',
    text: 'Please wait'
  }
}`,...(N=(y=t.parameters)==null?void 0:y.docs)==null?void 0:N.source}}};var T,R,h;o.parameters={...o.parameters,docs:{...(T=o.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    size: 'small',
    text: 'Small loading'
  }
}`,...(h=(R=o.parameters)==null?void 0:R.docs)==null?void 0:h.source}}};var C,F,q;i.parameters={...i.parameters,docs:{...(C=i.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    size: 'large',
    text: 'Large loading'
  }
}`,...(q=(F=i.parameters)==null?void 0:F.docs)==null?void 0:q.source}}};var z,V,w;c.parameters={...c.parameters,docs:{...(z=c.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    fullScreen: true,
    text: 'Loading full screen'
  }
}`,...(w=(V=c.parameters)==null?void 0:V.docs)==null?void 0:w.source}}};const le=["Default","Spinner","Dots","Pulse","Small","Large","FullScreen"];export{a as Default,l as Dots,c as FullScreen,i as Large,t as Pulse,o as Small,n as Spinner,le as __namedExportsOrder,ne as default};
