import{j as r}from"./jsx-runtime-D_zvdyIk.js";const S="_alert_4zm1u_2",I="_sm_4zm1u_14",b="_icon_4zm1u_19",E="_md_4zm1u_23",A="_lg_4zm1u_32",P="_content_4zm1u_53",V="_title_4zm1u_58",W="_message_4zm1u_63",C="_close_4zm1u_68",Y="_success_4zm1u_88",k="_warning_4zm1u_98",B="_error_4zm1u_108",O="_info_4zm1u_118",e={alert:S,sm:I,icon:b,md:E,lg:A,content:P,title:V,message:W,close:C,success:Y,warning:k,error:B,info:O},U={success:"✓",warning:"⚠",error:"✕",info:"ℹ"};function y({variant:o="info",size:z="md",title:c,children:N,icon:x,closable:T=!1,onClose:j,className:R=""}){const q=[e.alert,e[o],e[z],R].filter(Boolean).join(" ");return r.jsxs("div",{className:q,role:"alert",children:[r.jsx("span",{className:e.icon,children:x||U[o]}),r.jsxs("div",{className:e.content,children:[c&&r.jsx("div",{className:e.title,children:c}),r.jsx("div",{className:e.message,children:N})]}),T&&r.jsx("button",{className:e.close,onClick:j,"aria-label":"关闭",children:"×"})]})}y.__docgenInfo={description:"",methods:[],displayName:"Alert",props:{variant:{required:!1,tsType:{name:"union",raw:"'success' | 'warning' | 'error' | 'info'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'warning'"},{name:"literal",value:"'error'"},{name:"literal",value:"'info'"}]},description:"",defaultValue:{value:"'info'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'sm' | 'md' | 'lg'",elements:[{name:"literal",value:"'sm'"},{name:"literal",value:"'md'"},{name:"literal",value:"'lg'"}]},description:"",defaultValue:{value:"'md'",computed:!1}},title:{required:!1,tsType:{name:"string"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},closable:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onClose:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}}}};const F={title:"UI/Alert",component:y,tags:["autodocs"]},s={args:{variant:"info",title:"Information",children:"This is an informational message."}},a={args:{variant:"success",title:"Success",children:"Your action was completed successfully."}},n={args:{variant:"warning",title:"Warning",children:"Please review your input before proceeding."}},t={args:{variant:"error",title:"Error",children:"An error occurred. Please try again."}};var i,l,u;s.parameters={...s.parameters,docs:{...(i=s.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This is an informational message.'
  }
}`,...(u=(l=s.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var m,d,p;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    title: 'Success',
    children: 'Your action was completed successfully.'
  }
}`,...(p=(d=a.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var g,f,_;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Please review your input before proceeding.'
  }
}`,...(_=(f=n.parameters)==null?void 0:f.docs)==null?void 0:_.source}}};var v,h,w;t.parameters={...t.parameters,docs:{...(v=t.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    title: 'Error',
    children: 'An error occurred. Please try again.'
  }
}`,...(w=(h=t.parameters)==null?void 0:h.docs)==null?void 0:w.source}}};const G=["Info","Success","Warning","Error"];export{t as Error,s as Info,a as Success,n as Warning,G as __namedExportsOrder,F as default};
