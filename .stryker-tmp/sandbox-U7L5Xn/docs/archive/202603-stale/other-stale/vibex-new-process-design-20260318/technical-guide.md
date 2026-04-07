# VibeX 新流程设计技术指导文档

## 目录

一、流程设计概述
新流程架构
核心设计原则
二、状态管理架构
全局状态模型
步骤状态管理 依赖关系管理
三、详细步骤设计
步骤1: 需求录入
步骤2: 限界上下文
步骤3: 业务流程
步骤4: UI组件
步骤5:创建项目
四、渲染逻辑与组件设计
独立渲染机制 步骤切换逻辑 重新生成逻辑
五、API接口设计 统一分析接口 步骤特定接口
六、状态同步与缓存策略
状态持久化
缓存失效策略 回退与重做
七、前端实现指南
组件结构
状态管理实现 关键代码示例
八、异常处理与用户提示
依赖缺失处理
生成失败处理 用户提示规范
九、测试与验证
功能测试
状态一致性测试 用户体验测试




1. 流程设计概述


1.1新流程架构

VibeX 平台将原有的3步流程扩展为5步流程，实现更细粒度的需求分析和建模过程：



1.需求录入：用户输入产品需求描述
2. 限界上下文：AI 识别并展示限界上下文，用户勾选确认
3. 业务流程： 基于勾选的上下文生成业务流程，用户调整
4.UI  组件：基于业务流程生成UI  组件方案，用户选择
5. 创建项目：汇总所有信息，创建完整项目




1.2核心设计原则

●依赖驱动：每一步的数据生成严格依赖前序步骤的用户决策
●独立可访问：任何步骤均可独立访问和查看，不强制顺序浏览
● 状态透明：用户可清晰看到每一步的状态(未开始、进行中、已完成、已修 改 )
● 增量更新： 修改某一步后，后续步骤可选择重新生成或保持不变
● 回退友好：支持随时回退到任意步骤进行修改



2. 状态管理架构


2.1全局状态模型


//各步骤数据 steps:{
requirement:RequirementStep;
boundedContext:BoundedContextStep;
businessFlow:BusinessFlowStep;
uiComponent:UIComponentStep;
projectCreation:ProjectCreationStep; };

//全局状态
projectId:string                      |null;
isLoading:boolean;
error:string                    |null;

//历史记录(用于回退)
history:StepSnapshot[];
}

interface       RequirementStep       { status:StepStatus;
inputText:string;
charCount:number;
completedAt:Date                 |null; }

interface       BoundedContextStep       { status:StepStatus;
contexts:BoundedContext[];
selectedContextIds:string[];//                        用户勾选的上下文ID
userInputs:Record;/1               用户为每个上下文添加的备注
generatedAt:Date                 |null;
modifiedAt:Date                  |null; }

interface       BusinessFlowStep       { status:StepStatus;
flows:BusinessFlow[];
selectedFlowIds:string[];//     用户勾选的流程ID
modifications:FlowModification[];//                    用户修改记录
generatedAt:Date             |null;
modifiedAt:Date       |null; }
interface    UIComponentStep    {
status:Stepstatus;
components:UIComponent[];
selectedComponentIds:string[];//                 用户勾选的组件ID
customizations:ComponentCustomization[];//                用户自定义配置
generatedAt:Date             |null;
modifiedAt:Date              |null; }
interface      ProjectCreationStep      { status:Stepstatus;
projectData:ProjectData;
createdAt:Date             |null;
}

type   StepStatus   = |'pending'
I'generating' |'completed'    |'modified'
I'outdated';



//未开始  //正在生成 // 已完成
//已修改(用户调整过)
//已过期(前序步骤已修改)



2.2步骤状态管理

每个步骤都有独立的状态字段，用于控制渲染和行为：

状态
说明
可执行操作
pending
未开始，无数据
查看(显示占位符)

状态
说明
可执行操作
generating
正在调用AI生成
取消生成
completed
已生成，用户未修改
查看、修改、重新生成

modified

用户已手动调整
查看、继续修改、重新生 成

outdated
前序步骤已修改，数据可能过 期

查看、重新生成


2.3依赖关系管理

系统自动维护步骤间的依赖关系，当某一步骤被修改时，自动标记后续步骤为 outdated   :




3.1步骤1:需求录入

功能描述

用户输入产品需求描述，支持快速模板选择。

输入

●用户自由输入的需求文本
●可选：快速模板(电商平台、博客系统、任务管理等)

输出



下一步触发条件

用户点击"下一步"或"开始分析"按钮时，系统自动触发步骤2的生成。

状态转换


pending→completed    (用户输入并点击下一步)
completed→modified         (用户修改输入内容)



3.2步骤2:限界上下文 功能描述
AI 根据需求文本识别限界上下文，用户勾选确认。

输入依赖

●必需：步骤1的需求文本

AI 生成逻辑



输 出


interface    BoundedContext    { id:string;
name:string;
description:string;
keywords:string[];






//相关关键词
entities:string[];
//相关实体
confidence:number;
//AI  置信度0- 1
//UI  显示属性
selected:boolean; userNote:string;


//是否被勾选 //用户备注




用户交互

●勾选/取消勾选： 用户可选择哪些上下文纳入后续分析
●添加备注：为每个上下文添加补充说明                             
● 手动添加：用户可手动添加新的上下文
●删除：删除不相关的上下文

下 一 步触发条件

用户至少勾选一个上下文，并点击"下一步"时，触发步骤3生成。

状态转换




3.3步骤3:业务流程

功能描述

基于勾选的限界上下文，生成详细的业务流程。

输入依赖

●必需：步骤2中用户勾选的上下文列表
●可选：用户为各上下文添加的备注

AI 生成逻辑

async     function     generateBusinessFlows( selectedContexts:BoundedContext[]
):Promise<BusinessFlow[]>{
const         response          =await         fetch('/api/analyze/business-flows',{ method:'POST',
body:JSON.stringify({
contexts:selectedContexts,
userNotes:getUserNotes(selectedContexts)
})
});
return           response.json();




输出




用户交互

● 勾选流程：选择哪些流程纳入后续设计
● 编辑节点： 修改节点名称、描述、位置
●添加/删除节点：自定义流程步骤
● 调整连线： 改变流程走向

下一步触发条件

用户至少勾选一个流程，并点击"下一步"时，触发步骤4生成。


3.4步骤4: UI组件

功能描述

基于选定的业务流程，生成 UI 组件方案。

输入依赖

●必需：步骤3中用户勾选的业务流程
●可选：用户对流程节点的修改

AI 生成逻辑


})
});

return           response.json();




输出


interface     UIComponent     { id:string;
name:string;
type:'page'|'modal'|'form'|'list'|'detail'|'dashbc description:string;
flowId:string;                   //关联的业务流程

//组件详情
layout:ComponentLayout;
elements:UIElement[];

//UI  显示属性
selected:boolean;
customizations:Customization[];



interface  UIElement { id:string;
type:'button'|'input'|'select'|'table'|'chart'|'te label:string;
position:{x:number;y:number                       };
size:{width:number;height:number                        };

//绑定数据
dataBinding?:{
entity:string;
field:string;

用户交互

● 勾选组件：选择需要生成的UI组件
● 调整布局：拖拽调整组件位置和大小
● 自定义样式：修改颜色、字体等样式属性
● 添加组件：手动添加新的UI组件


3.5步骤5:创建项目

功能描述

汇总所有步骤的信息，创建完整的项目。

输入依赖

●步骤1:需求文本
●步骤2:选定的限界上下文
●步骤3:选定的业务流程
●步骤4:选定的UI组件

项目创建逻辑


),
uiComponents:state.steps.uiComponent.components.filter(c                      =
state.steps.uiComponent.selectedComponentIds.includes(c.i ),
metadata:{
createdAt:new           Date(),
updatedAt:new         Date(),
status:            'active'




const          response          =await          fetch('/api/projects',{ method:'POST',
body:JSON.stringify(projectData) });
return           response.json();




输 出





4.渲染逻辑与组件设计


4.1独立渲染机制

每个步骤作为独立组件渲染，根据状态显示不同内容：


function
StepRenderer({stepNumber            }:{stepNumber:number
}){
const
state          =useProjectStore();

const
stepState              =state.steps[getStepKey(stepNumber)];


switch(stepState.status){

case         'pending':
return           <StepPlaceholder

case           'generating':
return           <StepGenerating

case         'completed':
case          'modified':
return              <StepContent



step={stepNumber}/>;



step={stepNumber}/>;





step={stepNumber}data={stepState}/>

case   'outdated':
return(
<div>
<StepContent                       step={stepNumber}data={stepState}/>
<0utdatedWarning                      onRegenerate={()=>regenerateStep(s </div>







4.2步骤切换逻辑

用户可以随时切换到任意步骤查看内容：


function         StepNavigator(){
const           {currentStep,setCurrentStep,steps            }=useProjectStor

return(
<div     className="step-navigator">
{[1,2,3,4,5].map(step                 =>(
<StepButton
key={step}
step={step}
active={currentStep        ===step}
status={steps[getStepKey(step)].status}
onClick={()=>setCurrentStep(step)}









function             StepButton({step,active,status,onClick             }){ const       statusIcon       =getStatusIcon(status);

return(
<button
className={`step-button                       ${active?'active!:''}`} onClick={onClick}

{statusIcon} 步骤{step}
</button>




function               getStatusIcon(status:StepStatus){
switch(status){
case       'pending':return       'o';



4.3重新生成逻辑

当用户修改某一步骤后，后续步骤显示"重新生成"选项：


return           prevStatus           ==='completed'l|prevStatus           ==='modifiec



async
function
regenerateStep(stepNumber:number){
const
state
=useProjectStore.getState();

//1 .更新状态为 generating
updateStepStatus(stepNumber,'generating');

//2.获取依赖数据
const          dependencies          =getDependencies(stepNumber,state);

/ / 3 . 调 用 AI  接口
const newData =await callAIService(stepNumber,dependencies)

//4.更新步骤数据
updateStepData(stepNumber,newData);

//5.标记后续步骤为 outdated
markSubsequentStepsOutdated(stepNumber);






5. API 接口设计


5.1统一分析接口

提供一个统一的分析接口，支持按步骤生成：





5.2步骤特定接口

也可以为每个步骤提供专用接口：






6. 状态同步与缓存策略


6.1状态持久化

将用户进度保存到本地存储或后端：


//保存到本地存储
function                       saveToLocalStorage(state:ProjectState){
localStorage.setItem('vibex_project_state',JSON.stringify(st



//从本地存储恢复
function          loadFromLocalStorage():ProjectState          |null          {
const              saved              =localStorage.getItem('vibex_project_state');
return saved ?JSON.parse(saved):null;



/1 保存到后端(已登录用户)
async            function            saveToBackend(state:ProjectState){ if(state.projectId){
await                                   fetch(/api/projects/${state.projectId}/draft`,{
method:'PUT',
body:JSON.stringify(state) });





6.2缓存失效策略

当某一步骤被修改时，后续步骤的缓存数据标记为过期：




6.3回退与重做

实现简单的回退功能，允许用户撤销修改：






7. 前端实现指南


7.1组件结构


src/
app/
L      design/
page.tsx components/
十   design/
十  StepNavigator.tsx 上    StepRenderer.tsx





# 主页面



# 步骤导航器 # 步骤渲染器



7.2状态管理实现


selectedContextIds:[],
userInputs:{},
generatedAt:null,
modifiedAt:null },
//...其他步骤 },

//Actions
setCurrentStep:(step:number)=>set({currentStep:step                             }),

updateRequirementText:(text:string)=>{ const      state      =get();
set({
steps:{
..state.steps,
requirement:{
...state.steps.requirement,
inputText:text,
charCount:text.length,
status:'modified'



});

//标记后续步骤为过期
invalidateSubsequentSteps(1); },

generateBoundedContexts:async()=>{ const      state      =get();

//更新状态为 generating set({
steps:{
...state.steps,
boundedContext:{
...state.steps.boundedContext,
status:'generating'
}
}
});

try     {
/ / 调 用 AI  接口
const        contexts         =await         api.generateBoundedContexts( state.steps.requirement.inputText
);

//更新数据
set({
steps:{
...state.steps,
boundedContext:{
...state.steps.boundedContext,
contexts,
status:'completed',
generatedAt:new           Date()



});

// 保存快照
saveSnapshot(2);

}catch(error){
set({error:error.message                     }); }
},

/ / . . . 其 他 actions }));



7.3关键代码示例

步骤组件实现


//components/design/BoundedContextStep.tsx
export        function         BoundedContextStep(){
const        state        =useProjectStore();
const         stepState          =state.steps.boundedContext;


if(stepState.status
==='pending'){
return<StepPlaceholder
message="请先完成需求录入"/>;

if(stepState.status

==='generating'){
return   <LoadingSpinner
message="正在识别限界上下文..."/>;



return(
<div          className="bounded-context-step">
<h2>限界上下文识别</h2>

{stepState.contexts.map(context               =>(
<ContextCard
key={context.id}
context={context}
selected={stepState.selectedContextIds.includes(conte onSelect={(id)=>toggleContextSelection(id)}
onNoteChange={(id,note)=>updateContextNote(id,not

))}

{stepState.status                    ==='outdated'&&(
<0utdatedWarning            onRegenerate={state.generateBoundedCor
)}

<div        className="actions">
<button               onClick={state.generateBoundedContexts}>
重新生成
</button> <button


主页面实现






8. 异常处理与用户提示


8.1依赖缺失处理

当用户尝试访问未完成的步骤时，提供清晰提示：


function            StepAccessGuard({stepNumber,children             }){ const        state        =useProjectStore();

if(!isPreviousStepComplete(stepNumber,state)){

<div          className="step-access-guard">
<h3> 无法访问步骤{stepNumber}</h3>
<p>请先完成前序步骤：</p>
<ul>
{getIncompletePreviousSteps(stepNumber,state).map(st <li  key={step}>
<button                       onClick={()=>state.setCurrentStep(step)
步 骤 {step}:{getStepName(step)} </button>

))}

</div>



8.2生成失败处理

AI 生成失败时，提供重试选项：


async        function         generateWithRetry(stepNumber:number,maxRetries let   lastError;

for(let              i              =0;i<maxRetries;i++){ try    {
const     result     =await     generateStep(stepNumber);
return        result;
}catch(error){
lastError   =error;

if(i<maxRetries                   -1){
//等待一段时间后重试
await     new     Promise(resolve      =>setTimeout(resolve,1000     *






//所有重试都失败
throw new Error(`生成失败：${lastError.message}`);





8.3用户提示规范



●成功提示：使用绿色对勾图标，简洁文字
● 警告提示：使用黄色警告图标，说明问题和解决方案
●错误提示：使用红色错误图标，提供具体错误信息和重试选项
●信息提示：使用蓝色信息图标，提供上下文帮助





9.测试与验证


9.1功能测试

测试场景
预期结果
验证方法
顺序完成所有 步骤

每步数据正确生成，状态正确转换
手动测试+自动化 测试
跳转访问任意 步骤
已完成的步骤可查看，未完成的提 示依赖

手动测试
修改已完成的 步骤

后续步骤标记为outdated

状态检查
重新生成步骤
基于最新依赖数据生成
数据对比
状态持久化
刷新页面后状态恢复
本地存储检查


9.2状态一致性测试


describe('State                      Consistency',()=>{
it('should    mark   subsequent   steps    as   outdated   when    modifying    a const          store          =useProjectStore.getState();

//完成步骤1
store.updateRequirementText(   '测试需求';
store.generateBoundedContexts();

//验证步骤2已完成
expect(store.steps.boundedContext.status).toBe('completed')



9.3用户体验测试

● 易用性：用户能否快速理解流程?
●可见性：状态变化是否清晰可见?
●可恢复性：操作错误后能否轻松恢复?
● 性能：生成响应时间是否在可接受范围?
