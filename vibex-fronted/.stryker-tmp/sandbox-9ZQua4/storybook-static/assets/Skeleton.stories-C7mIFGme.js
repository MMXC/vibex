// @ts-nocheck
import{j as c}from"./jsx-runtime-D_zvdyIk.js";import{r as p}from"./index-D5jfS-9e.js";const T="_skeleton_jj5ek_1",b="_animate_jj5ek_11",I="_shimmer_jj5ek_1",S="_circle_jj5ek_24",q="_rect_jj5ek_28",E="_text_jj5ek_32",N="_textContainer_jj5ek_37",V="_card_jj5ek_43",R="_cardContent_jj5ek_49",A="_list_jj5ek_56",M="_listItem_jj5ek_62",O="_listItemContent_jj5ek_68",e={skeleton:T,animate:b,shimmer:I,circle:S,rect:q,text:E,textContainer:N,card:V,cardContent:R,list:A,listItem:M,listItemContent:O};function C({className:l="",variant:m="rect",width:r,height:a,animate:u=!0,lines:o=1}){const[$,w]=p.useState(!1);if(p.useEffect(()=>{w(!0)},[]),!$)return null;const t={};return r&&(t.width=typeof r=="number"?`${r}px`:r),a&&(t.height=typeof a=="number"?`${a}px`:a),m==="text"?c.jsx("div",{className:`${e.textContainer} ${l}`,children:Array.from({length:o}).map((U,d)=>c.jsx("div",{className:`${e.skeleton} ${e.text} ${u?e.animate:""}`,style:{...t,width:d===o-1&&o>1?"70%":t.width}},d))}):c.jsx("div",{"data-testid":"skeleton",className:`${e.skeleton} ${e[m]} ${u?e.animate:""} ${l}`,style:t})}C.__docgenInfo={description:"",methods:[],displayName:"Skeleton",props:{className:{required:!1,tsType:{name:"string"},description:"自定义类名",defaultValue:{value:"''",computed:!1}},variant:{required:!1,tsType:{name:"union",raw:"'circle' | 'rect' | 'text'",elements:[{name:"literal",value:"'circle'"},{name:"literal",value:"'rect'"},{name:"literal",value:"'text'"}]},description:"骨架屏变体: circle-圆形, rect-矩形, text-文本行",defaultValue:{value:"'rect'",computed:!1}},width:{required:!1,tsType:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}]},description:"自定义宽度"},height:{required:!1,tsType:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}]},description:"自定义高度"},animate:{required:!1,tsType:{name:"boolean"},description:"是否显示动画",defaultValue:{value:"true",computed:!1}},lines:{required:!1,tsType:{name:"number"},description:"子元素数量 (仅 text 类型有效)",defaultValue:{value:"1",computed:!1}}}};const D={title:"UI/Skeleton",component:C,tags:["autodocs"],argTypes:{variant:{control:"select",options:["text","circular","rectangular"]}}},n={args:{variant:"text",width:200,height:20}},s={args:{variant:"circle",width:60,height:60}},i={args:{variant:"rect",width:200,height:100}};var _,f,j;n.parameters={...n.parameters,docs:{...(_=n.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    variant: 'text',
    width: 200,
    height: 20
  }
}`,...(j=(f=n.parameters)==null?void 0:f.docs)==null?void 0:j.source}}};var x,g,h;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    variant: 'circle',
    width: 60,
    height: 60
  }
}`,...(h=(g=s.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var k,v,y;i.parameters={...i.parameters,docs:{...(k=i.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    variant: 'rect',
    width: 200,
    height: 100
  }
}`,...(y=(v=i.parameters)==null?void 0:v.docs)==null?void 0:y.source}}};const F=["Text","Circular","Rectangular"];export{s as Circular,i as Rectangular,n as Text,F as __namedExportsOrder,D as default};
