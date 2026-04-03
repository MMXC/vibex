# VibeX 状态逻辑准确性保障方案



目 录

一、 状态机设计
状态定义
状态转换规则
状态机实现
二、类型系统约束
类型定义
类型守卫
类型推断
三、不可变性保证 Immer 集成  深拷贝策略
四、状态验证机制 运行时验证
Schema  验证
自定义验证规则
五、测试策略
单元测试
状态一致性测试
边界条件测试
集成测试




 1. 状态机设计


1.1状态定义

严格定义每个步骤的状态类型，确保状态转换的可预测性：


//状态转换合法性检查
function          isValidTransition(from:StepStatus,to:StepStatus):
const    validTransitions:Record<StepStatus,StepStatus[]>={
pending:['generating'],
generating:['completed','pending'],/1           完成或失败
completed:['modified','outdated','generating'],
modified:['outdated','generating','completed'],
outdated:['generating','completed','modified'] };
return       validTransitions[from]?.includes(to)??false;





1.2状态转换规则

明确定义所有合法的状态转换路径：

当前状态
触发事件
目标状态
条件
pending
开始生成
generating
前序步骤已完成
generating
生成成功
completed
AI返回有效数据
generating
生成失败
pending
AI返回错误
generating
取消生成
pending
用户主动取消
completed
用户修改
modified
用户编辑内容
completed
前序修改
outdated
前序步骤状态改变
completed
重新生成
generating
用户点击重新生成
modified
前序修改
outdated
前序步骤状态改变
modified
重新生成
generating
用户点击重新生成

当前状态
触发事件
目标状态
条件
outdated
重新生成
generating
用户点击重新生成


1.3状态机实现


class      StepStateMachine      {
private     currentStatus:StepStatus;
private            stepNumber:number;
private                                listeners:StatusChangeListener[]=[];

constructor(stepNumber:number,initialStatus:StepStatus       = this.stepNumber            =stepNumber;
this.currentStatus        =initialStatus;
}

//状态转换
transition(to:StepStatus,context?:TransitionContext):bool //1 .验证转换合法性
if(!isValidTransition(this.currentStatus,to)){ console.error(
`Invalid   transition   from   ${this.currentStatus}to   ${to} );
return   false;
}

//2 .执行前置条件检查
if(!this.checkPreconditions(to,context)){
console.error(`Preconditions  not  met  for  transition  to  ${ return   false;
}

//3 . 保存旧状态
const   oldStatus   =this.currentStatus;

//4 . 执行转换
this.currentStatus       =to;

//5 .通知监听器
this.notifyListeners(oldStatus,to,context);

//6 . 记录日志
this.logTransition(oldStatus,to,context);

return       true;
}

// 前置条件检查
private             checkPreconditions(to:StepStatus,context?:Transiti
switch(to){
case         'generating':
return              this.canGenerate(context);
case        'completed':
return                this.hasValidData(context);
default:
return    true;




//检查是否可以生成
private     canGenerate(context?:TransitionContext):boolean     { //检查前序步骤是否完成
const           previousStepComplete            =this.isPreviousStepComplete(); if(!previousStepComplete){
return    false; }

//检查依赖数据是否存在 if(context?.requiredData){
return          context.requiredData.every(data          =>data           !=null);
}


return       true;

}
//检查数据有效性
private    hasValidData(context?:TransitionContext):boolean    {  return   context?.data    !=null    &&Object.keys(context.data).1
}

//获取当前状态
getStatus():StepStatus               {
return    this.currentStatus;
}

//添加监听器
addListener(listener:StatusChangeListener){ this.listeners.push(listener);
}

//通知监听器
private                notifyListeners(
from:StepStatus, to:StepStatus,
context?:TransitionContext ){
this.listeners.forEach(listener        =>{ try     {
listener.onStatusChange(this.stepNumber,from,to,cont }catch(error){
console.error('Listener          error:',error);
}
});
}


//记录日志
private              logTransition(
from:StepStatus, to:StepStatus,
context?:TransitionContext ){
console.log({                                                                                                   




2.类型系统约束


2.1类型定义

使 用TypeScript      的严格类型系统约束状态结构：


}

//各步骤具体类型
interface    RequirementStep    extends    BaseStep    { status:'pending'|'completed'|'modified';
inputText:string;
charCount:number;
}

interface    BoundedContextStep    extends     BaseStep     { contexts:BoundedContext[];
selectedContextIds:string[];
userInputs:Record<string,string>; }

//联合类型确保类型安全 type    StepState    =
|{step:1;data:RequirementStep                      }
|{step:2;data:BoundedContextStep                      }
|{step:3;data:BusinessFlowStep                       }
|{step:4;data:UIComponentStep                     }
|{step:5;data:ProjectCreationStep                           };

//全局状态
interface       ProjectState       { currentStep:number;
projectId:string                    |null;
isLoading:boolean;
error:string                  |null;

steps:{
requirement:RequirementStep;
boundedContext:BoundedContextStep;
businessFlow:BusinessFlowStep;
uiComponent:UIComponentStep;
projectCreation:ProjectCreationStep; };




2.2类型守卫

使用类型守卫确保运行时类型安全：


//状态类型守卫
function           isRequirementStep(step:any):step            is           RequirementStep return(
typeof           step.status            ==='string'&&
['pending','completed','modified'].includes(step.status)
typeof            step.inputText             ==='string'&&
typeof        step.charCount        ==='number'




function          isBoundedContextStep(step:any):step           is           BoundedContex return(
typeof           step.status            ==='string'&&
Array.isArray(step.contexts)&&
Array.isArray(step.selectedContextIds)&&
typeof           step.userInputs           ==='object'





//数据验证守卫
function   isValidBoundedContext(context:any):context    is    Bounde return(
typeof     context.id     ==='string'&&
typeof   context.name    ==='string'&&
typeof              context.description              ==='string'&&
typeof   context.confidence   ==='number'&&
context.confidence       >=0       &&
context.confidence             <=1 );



2.3类型推断

利用 TypeScript    的类型推断减少错误：


//使用泛型约束状态更新
function      updateStepData<K     extends      keyof      ProjectState['steps']>( stepKey:K,
updater:(draft:ProjectState['steps'][K])=>void ):void        {




3. 不可变性保证


3.1 Immer 集成

使用Immer    库确保状态的不可变性：


//初始状态  currentStep:1, projectId:null,
isLoading:false, error:null,   history:[],

steps:{
requirement:{
status:'pending', inputText:'',
charCount:0,   generatedAt:null, modifiedAt:null
},
// . . . 其他步骤 },
/ / 使 用 Immer  的 draft      进行更新
updateRequirementText:(text:string)=>{ set((state)=>{
//直接修改 draft,Immer    会处理不可变性
state.steps.requirement.inputText                        =text;
state.steps.requirement.charCount                          =text.length;
state.steps.requirement.status                           ='modified';
state.steps.requirement.modifiedAt             =new             Date();

//标记后续步骤为过期
for(let                                 i=2;i<=5;i++){
const        stepKey        =getStepKey(i);
if(state.steps[stepKey].status                                  !=='pending'){
state.steps[stepKey].status            ='outdated';
}
}
});
},

generateBoundedContexts:async()=>{
const       state        =get();

// 设置为生成中
set((draft)=>{
draft.steps.boundedContext.status                           ='generating';
draft.isLoading                =true;
});

try     {
const        contexts         =await         api.generateBoundedContexts( state.steps.requirement.inputText
);

// 更新数据
set((draft)=>{
draft.steps.boundedContext.contexts                        =contexts;
draft.steps.boundedContext.status                          ='completed';
draft.steps.boundedContext.generatedAt             =new             Date(); draft.isLoading                =false;
});

//保存快照
saveSnapshot(2);

}catch(error){
set((draft)=>{
draft.steps.boundedContext.status                          ='pending';
draft.error                 =error.message;
draft.isLoading                =false;
});



))
);



3.2深拷贝策略

对于复杂对象，使用深拷贝确保独立性：


import{cloneDeep            }from            'lodash';

//保存快照时使用深拷贝
function                   saveSnapshot(stepNumber:number){
const            state            =useProjectStore.getState();
const        stepKey        =getStepKey(stepNumber);

const         snapshot:StepSnapshot         ={ stepNumber,
timestamp:new           Date(),
//深拷贝确保快照独立
data:cloneDeep(state.steps[stepKey]) };
state.history.push(snapshot);

//限制历史记录数量
if(state.history.length                          >20){ state.history.shift();
}



//恢复快照
function                         restoreSnapshot(snapshot:StepSnapshot){
const            state            =useProjectStore.getState();
const          stepKey           =getStepKey(snapshot.stepNumber);


useProjectStore.setState({ steps:{
...state.steps,
[stepKey]:cloneDeep(snapshot.data) }
});
}




4.1运行时验证

在关键操作前验证状态一致性：

class StateValidator { //验证步骤依赖关系
static               validateStepDependencies(
stepNumber:number,
state:ProjectState
):ValidationResult    {
const          errors:string[]=[];

//检查前序步骤
for(let                                  i=1;i<stepNumber;i++){
const         prevStepKey         =getStepKey(i);
const              prevStatus              =state.steps[prevStepKey].status;

if(prevStatus                    ==='pending'I|prevStatus                    ==='generatir errors.push        ( 步 骤 $ {i}    尚未完成`);
}


return  {
valid:errors.length     ===0,
errors };
}

//验证步骤数据完整性
static             validateStepData(
stepNumber:number,
data:any
):ValidationResult    {
const          errors:string[]=[];

switch(stepNumber){
case    1:
if(!data.inputText                   ||data.inputText.trim().length                    === errors.push(  '需求文本不能为空');
}
break;

case    2:
if(!Array.isArray(data.contexts)||data.contexts.leng errors.push(  '必须生成至少一个限界上下文');
}
if(!Array.isArray(data.selectedContextIds)||data.sel errors.push(  '必须至少选择一个限界上下文');
}
break;

case    3:
if(!Array.isArray(data.flows)                       ||    data.flows.length            ===
errors.push(  '必须生成至少一个业务流程');
}
break;

// . . . 其他步骤
}

return   {
valid:errors.length        ===0,
errors
};
}

//验证状态转换
static       validateTransition(
from:StepStatus, to:StepStatus,
stepNumber:number
):ValidationResult       {
const             errors:string[]=[];                                                 



4.2    Schema 验 证

使 用JSON       Schema 进行数据验证：


maximum:1 },
keywords:{
type:'array',
items:{type:'string'} },
entities:{
type:'array',
items:{type:'string'}
}

};

const      boundedContextStepSchema      ={ type:'object',
required:['status','contexts','selectedContextIds'],
properties:{ status:{
type:'string',
enum:['pending','generating','completed','modified', ],
contexts:{
type:'array',
items:boundedContextSchema
},
selectedContextIds:{
type:'array',
items:{type:'string'} },
userInputs:{
type:'object',
additionalProperties:{type:'string'}

}


};

//编译验证函数
const             validateBoundedContextStep              =ajv.compile(boundedContextSt



4.3自定义验证规则


if(selectedIds.length                       ===0){
errors.push(  '必须至少选择一个限界上下文');
}

//检查置信度
const          lowConfidenceContexts          =contexts.filter(c          =>
selectedIds.includes(c.id)&&c.confidence<0.5 );

if(lowConfidenceContexts.length>0){
console.warn(  '部分选择的上下文置信度较低：',lowConfidenceCont
}

return      {
valid:errors.length                   ===0,
errors
};
}

//验证业务流程完整性
static                                validateBusinessFlow(flow:BusinessFlow):ValidationRe
const                        errors:string[]=[];

//检查是否有开始节点
const         hasStart          =flow.nodes.some(n          =>n.type          ==='start'); if(!hasStart){
errors.push(      '流程必须包含开始节点'; }

//检查是否有结束节点
const        hasEnd        =flow.nodes.some(n        =>n.type        ==='end'); if(!hasEnd){
errors.push(      '流程必须包含结束节点'); }

//检查连线完整性
flow.edges.forEach(edge  const        sourceExists


=>{
=flow.nodes.some(n




=>n.id        ===edge.s
const       targetExists       =flow.nodes.some(n       =>n.id       ===edge.t

if(!sourceExists){
errors.push (连线源节点${edge.source}  不存在`);

if(!targetExists){
errors.push (连线目标节点${edge.target}  不存在`);

});

return     {
valid:errors.length  ===0,
errors









5. 测试策略


5.1单元测试


import             {describe,it,expect,beforeEach             }from              'vitest';

describe('StepStateMachine',()=>{
let            machine:StepStateMachine;


beforeEach(()=>{
machine      =new      StepStateMachine(2); });
it('should   initialize   with   pending   status',()=>{ expect(machine.getStatus()).toBe('pending');
});
it('should allow transition from pending to generating',()=
const     result     =machine.transition('generating',{
requiredData:['test'] });
expect(result).toBe(true);
expect(machine.getStatus()).toBe('generating'); });
it('should     not     allow     invalid     transition',()=>{ const    result    =machine.transition('completed');
expect(result).toBe(false);
expect(machine.getStatus()).toBe('pending'); });

it('should           check           preconditions           before           transition',()=>{ const     result     =machine.transition('generating',{
requiredData:[]//      缺少必需数据 });
expect(result).toBe(false);
expect(machine.getStatus()).toBe('pending'); });
});

describe('StateValidator',()=>{
it('should           validate            step            dependencies',()=>{ const  state  =createMockState();
state.steps.requirement.status                         ='pending';

const                result                 =StateValidator.validateStepDependencies(2,s

expect(result.valid).toBe(false);
expect(result.errors).toContain(                         ' 步 骤 1 尚未完成'); });
it('should   validate   bounded   context   data',()=>{
const  data  ={    status:'completed', contexts:[],
selectedContextIds:[]



5.2状态一致性测试





5.3边界条件测试


const          store           =useProjectStore.getState();


store.updateRequirementText('');

expect(store.steps.requirement.inputText).toBe('');
expect(store.steps.requirement.charCount).toBe(0);
expect(store.steps.requirement.status).toBe('modified'); });

it('should        handle        very        long        input',()=>{ const          store           =useProjectStore.getState();
const         longText          ='a'.repeat(10000);

store.updateRequirementText(longText);

expect(store.steps.requirement.inputText).toBe(longText);
expect(store.steps.requirement.charCount).toBe(10000); });

it('should        handle        rapid        state        changes',async()=>{ const          store           =useProjectStore.getState();

//快速切换步骤
for(let                              i=0;i<100;i++){
store.setCurrentStep((i%5)+1);
}

//验证状态仍然有效
const         state         =store.getState();
expect(state.currentStep).toBeGreaterThanOrEqual(1);
expect(state.currentStep).toBeLessThanOrEqual(5); });
it('should    handle    AI     service    failure',async()=>{
//Mock   AI 服务失败
vi.spyOn(api,'generateBoundedContexts').mockRejectedValue( new      Error('AI      service      unavailable')
);
const          store          =useProjectStore.getState();
store.updateRequirementText(              '测试需求';

await             store.generateBoundedContexts();

//验证错误处理
expect(store.steps.boundedContext.status).toBe('pending');
expect(store.error).toBe('AI      service      unavailable'); });
});



5.4集成测试


store.toggleFlowSelection('flow-1');
store.setCurrentStep(4);

//步骤4: UI 组件
await               store.generateUIComponents();
await               waitFor(()=>{
expect(store.steps.uiComponent.status).toBe('completed'); });

store.toggleComponentSelection('component-1');
store.setCurrentStep(5);

//步骤5:创建项目
await                 store.createProject();
await               waitFor(()=>{
expect(store.steps.projectCreation.status).toBe(complete });

//验证完整流程
expect(store.projectId).not.toBeNull();
expect(store.steps.projectCreation.projectData).toBeDefinec });
});




6. 监控与调试


6.1状态变化日志


class     StateLogger     {
private               static               logs:StateLog[]=[];

static         logChange(
action:string,
prevState:ProjectState,
nextState:ProjectState, metadata?:any
){
const       log:StateLog       ={
timestamp:new           Date(),
action,
prevState:cloneDeep(prevState),
nextState:cloneDeep(nextState),
diff:this.computeDiff(prevState,nextState),
metadata };
this.logs.push(log);

//开发环境输出详细日志
if(process.env.NODE_ENV                 ==='development'){
console.group(`State                  Change:${action}`);
console.log('Previous:',prevState);
console.log('Next:',nextState);
console.log('Diff:',log.diff);
console.log('Metadata:',metadata);
console.groupEnd(); }

// 限制日志数量
if(this.logs.length                     >100){
this.logs.shift(); }


static              computeDiff(prev:any,next:any):any               {
//使用深度比较库计算差异
return       diff(prev,next);
}

static
return
}

getLogs():StateLog[]{ this.logs;









6.2开发工具


//Zustand         DevTools  集成
import           {devtools           }from'zustand/middleware';

export       const       useProjectStore       =create<ProjectState>()(
devtools(
immer((set,get)=>({
// . . .状态和 actions })),

name:'VibeX      Project      Store',
enabled:process.env.NODE_ENV        ==='development'






//自定义调试工具
class   DebugTools   { //检查状态一致性
static                            checkConsistency(state:ProjectState):string[]{
const            issues:string[]=[];

//检查当前步骤是否有效
if(state.currentStep<1                                           ||state.currentStep>5){
issues.push(`Invalid                 current                 step:${state.currentStep}`)
}

//检查步骤状态与当前步骤的一致性 if(state.currentStep                      >1){
for(let                                         i=1;i<state.currentStep;i++){
const        stepKey        =getStepKey(i);
const             status              =state.steps[stepKey].status;

if(status                     ==='pending'I|status                     ==='generating'){   issues.push(`Step      ${i}is      not      completed       but      current      s
}





//检查历史记录完整性
state.history.forEach((snapshot,index)=>{
if(!snapshot.timestamp                             ||!snapshot.data){
issues.push(`Invalid        snapshot        at        index        ${index}`); }
});

return   issues; }

//导出状态用于调试
static        exportState(state:ProjectState):string        { return                           JSON.stringify(state,null,2);
}

//模拟状态
static                                      mockState(partial:Partial<ProjectState>):ProjectStat
return   {
currentStep:1                                                                                             



6.3错误追踪


}
){
const    record:ErrorRecord    ={ timestamp:new           Date(),
error:{
name:error.name,
message:error.message,
stack:error.stack },
context,
userAgent:navigator.userAgent,
url:window.location.href };
this.errors.push(record);

//发送到错误追踪服务
if(process.env.NODE_ENV                       ==='production'){
this.sendToService(record); }

//开发环境输出
console.error('Error             tracked:',record);
}

private               static               sendToService(record:ErrorRecord){ //发送到 Sentry  或其他错误追踪服务
fetch('/api/errors',{ method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify(record) }).catch(err       =>{
console.error('Failed     to      send      error      report:',err); });
}

static
return

getErrors():ErrorRecord[]{ this.errors;






interface     ErrorRecord     { timestamp:Date;
error:{
name:string;
message:string;
stack?:string; };
context:{
step?:number;
action?:string;
state?:ProjectState; };
userAgent:string;
url:string;



//使用错误边界
class   StateErrorBoundary   extends   React.Component   { componentDidCatch(error:Error,errorInfo:React.ErrorInfo){
ErrorTracker.trackError(error,{
action:'component_error',
state:useProjectStore.getState()
});


render(){
return            this.props.children;







7.最佳实践



7.1单一数据源



●所有状态统一存储在Zustand store中
●避免组件内部维护冗余状态
●所有状态更新通过store actions完成
●使用选择器优化性能




7.2明确的状态转换



●每个状态转换都有明确的触发条件
●使用状态机管理转换规则
●禁止直接修改状态，必须通过actions
●所有转换都记录日志




7.3完善的文档



●为每个状态和转换编写文档
●记录状态转换的业务逻辑
●维护状态图和数据流图
●定期审查和更新文档