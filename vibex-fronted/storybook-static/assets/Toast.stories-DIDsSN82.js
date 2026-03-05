import{j as r}from"./jsx-runtime-D_zvdyIk.js";import{r as c}from"./index-D5jfS-9e.js";const N="_container_1986y_1",A="_toast_1986y_14",V="_slideIn_1986y_1",$="_icon_1986y_38",P="_message_1986y_44",W="_close_1986y_49",k="_success_1986y_67",O="_error_1986y_76",R="_warning_1986y_85",U="_info_1986y_94",s={container:N,toast:A,slideIn:V,icon:$,message:P,close:W,success:k,error:O,warning:R,info:U};c.createContext(null);function S({message:h,type:i="info",onClose:e,autoClose:I=!0,duration:u=5e3}){const[b,j]=c.useState(!0);if(c.useState(()=>{if(I&&u>0){const q=setTimeout(()=>{j(!1),e==null||e()},u);return()=>clearTimeout(q)}}),!b)return null;const E={success:"✓",error:"✕",warning:"⚠",info:"ℹ"};return r.jsxs("div",{className:`${s.toast} ${s[i]}`,role:"alert",children:[r.jsx("span",{className:s.icon,children:E[i]}),r.jsx("span",{className:s.message,children:h}),e&&r.jsx("button",{className:s.close,onClick:e,"aria-label":"关闭",children:"×"})]})}S.__docgenInfo={description:"",methods:[],displayName:"Toast",props:{message:{required:!0,tsType:{name:"string"},description:""},type:{required:!1,tsType:{name:"union",raw:"'success' | 'error' | 'warning' | 'info'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'error'"},{name:"literal",value:"'warning'"},{name:"literal",value:"'info'"}]},description:"",defaultValue:{value:"'info'",computed:!1}},onClose:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},autoClose:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"true",computed:!1}},duration:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"5000",computed:!1}}}};const D={title:"UI/Toast",component:S,tags:["autodocs"]},a={args:{type:"info",message:"This is an informational toast"}},n={args:{type:"success",message:"Action completed successfully"}},t={args:{type:"warning",message:"Please review your input"}},o={args:{type:"error",message:"An error occurred"}};var l,m,p;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    type: 'info',
    message: 'This is an informational toast'
  }
}`,...(p=(m=a.parameters)==null?void 0:m.docs)==null?void 0:p.source}}};var d,g,f;n.parameters={...n.parameters,docs:{...(d=n.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    type: 'success',
    message: 'Action completed successfully'
  }
}`,...(f=(g=n.parameters)==null?void 0:g.docs)==null?void 0:f.source}}};var _,y,v;t.parameters={...t.parameters,docs:{...(_=t.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    type: 'warning',
    message: 'Please review your input'
  }
}`,...(v=(y=t.parameters)==null?void 0:y.docs)==null?void 0:v.source}}};var w,T,x;o.parameters={...o.parameters,docs:{...(w=o.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    type: 'error',
    message: 'An error occurred'
  }
}`,...(x=(T=o.parameters)==null?void 0:T.docs)==null?void 0:x.source}}};const F=["Info","Success","Warning","Error"];export{o as Error,a as Info,n as Success,t as Warning,F as __namedExportsOrder,D as default};
