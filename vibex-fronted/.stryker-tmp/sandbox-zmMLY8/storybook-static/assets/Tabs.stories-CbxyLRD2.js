// @ts-nocheck
import{j as n}from"./jsx-runtime-D_zvdyIk.js";import{r as c}from"./index-D5jfS-9e.js";const F="_container_lbm8l_3",U="_tabList_lbm8l_10",K="_bottom_lbm8l_17",O="_tabs_lbm8l_23",P="_actions_lbm8l_36",W="_tab_lbm8l_10",z="_disabled_lbm8l_69",B="_active_lbm8l_69",G="_icon_lbm8l_84",H="_label_lbm8l_95",J="_close_lbm8l_101",M="_indicator_lbm8l_122",Q="_content_lbm8l_133",X="_fadeIn_lbm8l_1",Y="_line_lbm8l_152",Z="_pill_lbm8l_166",ee="_card_lbm8l_197",t={container:F,tabList:U,bottom:K,tabs:O,actions:P,tab:W,disabled:z,active:B,icon:G,label:H,close:J,indicator:M,content:Q,fadeIn:X,line:Y,pill:Z,card:ee};function u({items:l,activeIndex:o,defaultIndex:_=0,onChange:m,variant:p="line",closable:S=!1,onClose:f,showActions:q=!1,actions:v,className:C="",position:$="top"}){const A=_<l.length?_:0,[R,V]=c.useState(A),[T,D]=c.useState({left:0,width:0}),x=c.useRef([]),i=o!==void 0?o:R,E=(e,a)=>{a||(o===void 0&&V(e),m==null||m(e))},y=(e,a)=>{e.stopPropagation(),f==null||f(a)};c.useEffect(()=>{const e=x.current[i];e&&D({left:e.offsetLeft,width:e.offsetWidth})},[i,p]);const L=()=>{const e=l[i];return e!=null&&e.content?n.jsx("div",{className:t.content,children:e.content}):null};return n.jsxs("div",{className:`${t.container} ${t[p]} ${C}`,children:[n.jsxs("div",{className:`${t.tabList} ${t[$]}`,children:[n.jsxs("div",{className:t.tabs,children:[l.map((e,a)=>{const I=a===i,r=e.disabled;return n.jsxs("button",{ref:s=>{x.current[a]=s},className:`${t.tab} ${I?t.active:""} ${r?t.disabled:""}`,onClick:()=>E(a,r),disabled:r,role:"tab","aria-selected":I,"aria-disabled":r,children:[e.icon&&n.jsx("span",{className:t.icon,children:e.icon}),n.jsx("span",{className:t.label,children:e.label}),S&&!r&&n.jsx("span",{className:t.close,onClick:s=>y(s,a),role:"button",tabIndex:0,onKeyDown:s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),y(s,a))},children:"×"})]},a)}),p==="line"&&n.jsx("div",{className:t.indicator,style:{left:`${T.left}px`,width:`${T.width}px`}})]}),q&&v&&n.jsx("div",{className:t.actions,children:v})]}),L()]})}u.__docgenInfo={description:"",methods:[],displayName:"Tabs",props:{items:{required:!0,tsType:{name:"Array",elements:[{name:"TabItem"}],raw:"TabItem[]"},description:"Tab 项列表"},activeIndex:{required:!1,tsType:{name:"number"},description:"当前激活的 tab 索引 (受控模式)"},defaultIndex:{required:!1,tsType:{name:"number"},description:"默认激活的 tab 索引 (非受控模式)",defaultValue:{value:"0",computed:!1}},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(index: number) => void",signature:{arguments:[{type:{name:"number"},name:"index"}],return:{name:"void"}}},description:"Tab 切换回调"},variant:{required:!1,tsType:{name:"union",raw:"'line' | 'pill' | 'card'",elements:[{name:"literal",value:"'line'"},{name:"literal",value:"'pill'"},{name:"literal",value:"'card'"}]},description:"Tab 样式变体",defaultValue:{value:"'line'",computed:!1}},closable:{required:!1,tsType:{name:"boolean"},description:"是否可关闭 (配合 onClose 使用)",defaultValue:{value:"false",computed:!1}},onClose:{required:!1,tsType:{name:"signature",type:"function",raw:"(index: number) => void",signature:{arguments:[{type:{name:"number"},name:"index"}],return:{name:"void"}}},description:"Tab 关闭回调"},showActions:{required:!1,tsType:{name:"boolean"},description:"是否显示底部操作栏",defaultValue:{value:"false",computed:!1}},actions:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"渲染额外的操作区域"},className:{required:!1,tsType:{name:"string"},description:"自定义类名",defaultValue:{value:"''",computed:!1}},position:{required:!1,tsType:{name:"union",raw:"'top' | 'bottom'",elements:[{name:"literal",value:"'top'"},{name:"literal",value:"'bottom'"}]},description:"位置",defaultValue:{value:"'top'",computed:!1}}}};const ae={title:"UI/Tabs",component:u,tags:["autodocs"]},d={render:()=>{const[l,o]=c.useState(0);return n.jsx(u,{activeIndex:l,onChange:o,items:[{key:"tab1",label:"Tab 1",content:"Content for Tab 1"},{key:"tab2",label:"Tab 2",content:"Content for Tab 2"},{key:"tab3",label:"Tab 3",content:"Content for Tab 3"}]})}},b={render:()=>{const[l,o]=c.useState(0);return n.jsx(u,{activeIndex:l,onChange:o,items:[{key:"tab1",label:"First",content:"First tab content"},{key:"tab2",label:"Second",content:"Second tab content"}]})}};var h,k,g;d.parameters={...d.parameters,docs:{...(h=d.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => {
    const [activeIndex, setActiveIndex] = useState(0);
    return <Tabs activeIndex={activeIndex} onChange={setActiveIndex} items={[{
      key: 'tab1',
      label: 'Tab 1',
      content: 'Content for Tab 1'
    }, {
      key: 'tab2',
      label: 'Tab 2',
      content: 'Content for Tab 2'
    }, {
      key: 'tab3',
      label: 'Tab 3',
      content: 'Content for Tab 3'
    }]} />;
  }
}`,...(g=(k=d.parameters)==null?void 0:k.docs)==null?void 0:g.source}}};var j,w,N;b.parameters={...b.parameters,docs:{...(j=b.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => {
    const [activeIndex, setActiveIndex] = useState(0);
    return <Tabs activeIndex={activeIndex} onChange={setActiveIndex} items={[{
      key: 'tab1',
      label: 'First',
      content: 'First tab content'
    }, {
      key: 'tab2',
      label: 'Second',
      content: 'Second tab content'
    }]} />;
  }
}`,...(N=(w=b.parameters)==null?void 0:w.docs)==null?void 0:N.source}}};const se=["Default","TwoTabs"];export{d as Default,b as TwoTabs,se as __namedExportsOrder,ae as default};
