/**
 * Prompt Template Library
 * 
 * This module exports all prompt templates for the VibeX AI system.
 * It provides a centralized access point for all AI prompts used in
 * code generation, analysis, review, and other AI-powered features.
 * 
 * @module prompts
 */

// Bug Detection Prompts
// Note: Some names conflict with other modules, so we export with namespace
import * as BugDetection from './bug-detection';
export { BugDetection };

// Clarification Prompts
import * as Clarification from './clarification';
export { Clarification };

// Code Generation Prompts
import * as CodeGeneration from './code-generation';
export { CodeGeneration };

// Code Review Prompts
import * as CodeReview from './code-review';
export { CodeReview };

// Domain Entity Extraction Prompts
import * as DomainEntityExtraction from './domain-entity-extraction';
export { DomainEntityExtraction };

// Entity Extraction Prompts
import * as EntityExtraction from './entity-extraction';
export { EntityExtraction };

// Flow Collaboration Prompts
import * as FlowCollaboration from './flow-collaboration';
export { FlowCollaboration };

// Flow Execution Prompts
import * as FlowExecution from './flow-execution';
export { FlowExecution };

// Flow Generation Prompts
import * as FlowGeneration from './flow-generation';
export { FlowGeneration };

// Flow Analysis Prompts
import * as FlowAnalysis from './flow-analysis';
export { FlowAnalysis };

// Flow Optimization Prompts
import * as FlowOptimization from './flow-optimization';
export { FlowOptimization };

// Flow Visualization Prompts
import * as FlowVisualization from './flow-visualization';
export { FlowVisualization };

// Prompt Engineering Prompts
import * as PromptEngineering from './prompt-engineering';
export { PromptEngineering };

// Relation Analysis Prompts
import * as RelationAnalysis from './relation-analysis';
export { RelationAnalysis };

// Relation Extraction Prompts
import * as RelationExtraction from './relation-extraction';
export { RelationExtraction };

// Requirement Understanding Prompts
import * as RequirementUnderstanding from './requirement-understanding';
export { RequirementUnderstanding };

// Requirement Validation Prompts
import * as RequirementValidation from './requirement-validation';
export { RequirementValidation };

// Test Generation Prompts
import * as TestGeneration from './test-generation';
export { TestGeneration };

// UI Analysis Prompts
import * as UiAnalysis from './ui-analysis';
export { UiAnalysis };

// UI Generation Prompts
import * as UiGeneration from './ui-generation';
export { UiGeneration };

// UI Refinement Prompts
import * as UiRefinement from './ui-refinement';
export { UiRefinement };

// UI Testing Prompts
import * as UiTesting from './ui-testing';
export { UiTesting };

/**
 * Prompt Category Definitions
 * 
 * Groups prompts by their primary functionality area.
 */
export enum PromptCategory {
  CODE_GENERATION = 'code_generation',
  CODE_REVIEW = 'code_review',
  BUG_DETECTION = 'bug_detection',
  REQUIREMENT = 'requirement',
  CLARIFICATION = 'clarification',
  ENTITY_EXTRACTION = 'entity_extraction',
  RELATION_ANALYSIS = 'relation_analysis',
  UI_GENERATION = 'ui_generation',
  UI_ANALYSIS = 'ui_analysis',
  UI_REFINEMENT = 'ui_refinement',
  UI_TESTING = 'ui_testing',
  PROMPT_ENGINEERING = 'prompt_engineering',
  FLOW_EXECUTION = 'flow_execution',
  FLOW_GENERATION = 'flow_generation',
  FLOW_ANALYSIS = 'flow_analysis',
  FLOW_OPTIMIZATION = 'flow_optimization',
  FLOW_VISUALIZATION = 'flow_visualization',
  FLOW_COLLABORATION = 'flow_collaboration',
}

/**
 * Metadata for each prompt category
 */
export const PROMPT_CATEGORY_METADATA: Record<PromptCategory, {
  name: string;
  description: string;
  module: string;
}> = {
  [PromptCategory.CODE_GENERATION]: {
    name: 'Code Generation',
    description: 'Prompts for generating code snippets, functions, classes, and modules',
    module: 'CodeGeneration',
  },
  [PromptCategory.CODE_REVIEW]: {
    name: 'Code Review',
    description: 'Prompts for reviewing code and identifying issues',
    module: 'CodeReview',
  },
  [PromptCategory.BUG_DETECTION]: {
    name: 'Bug Detection',
    description: 'Prompts for detecting bugs and code defects',
    module: 'BugDetection',
  },
  [PromptCategory.REQUIREMENT]: {
    name: 'Requirement Understanding',
    description: 'Prompts for understanding and analyzing requirements',
    module: 'RequirementUnderstanding',
  },
  [PromptCategory.CLARIFICATION]: {
    name: 'Clarification',
    description: 'Prompts for generating clarification questions',
    module: 'Clarification',
  },
  [PromptCategory.ENTITY_EXTRACTION]: {
    name: 'Entity Extraction',
    description: 'Prompts for extracting entities from text',
    module: 'EntityExtraction',
  },
  [PromptCategory.RELATION_ANALYSIS]: {
    name: 'Relation Analysis',
    description: 'Prompts for analyzing relationships between entities',
    module: 'RelationAnalysis',
  },
  [PromptCategory.UI_GENERATION]: {
    name: 'UI Generation',
    description: 'Prompts for generating UI components',
    module: 'UiGeneration',
  },
  [PromptCategory.UI_ANALYSIS]: {
    name: 'UI Analysis',
    description: 'Prompts for analyzing UI designs',
    module: 'UiAnalysis',
  },
  [PromptCategory.UI_REFINEMENT]: {
    name: 'UI Refinement',
    description: 'Prompts for refining and improving UI designs',
    module: 'UiRefinement',
  },
  [PromptCategory.UI_TESTING]: {
    name: 'UI Testing',
    description: 'Prompts for generating UI tests',
    module: 'UiTesting',
  },
  [PromptCategory.PROMPT_ENGINEERING]: {
    name: 'Prompt Engineering',
    description: 'Prompts for optimizing and improving prompts',
    module: 'PromptEngineering',
  },
  [PromptCategory.FLOW_EXECUTION]: {
    name: 'Flow Execution',
    description: 'Prompts for executing flows, generating execution plans, and converting flows to code',
    module: 'FlowExecution',
  },
  [PromptCategory.FLOW_GENERATION]: {
    name: 'Flow Generation',
    description: 'Prompts for generating flow diagrams and workflows',
    module: 'FlowGeneration',
  },
  [PromptCategory.FLOW_ANALYSIS]: {
    name: 'Flow Analysis',
    description: 'Prompts for analyzing, validating and optimizing flows',
    module: 'FlowAnalysis',
  },
  [PromptCategory.FLOW_OPTIMIZATION]: {
    name: 'Flow Optimization',
    description: 'Prompts for optimizing and improving existing flows',
    module: 'FlowOptimization',
  },
  [PromptCategory.FLOW_VISUALIZATION]: {
    name: 'Flow Visualization',
    description: 'Prompts for visualizing flows with layouts, styling, and rendering',
    module: 'FlowVisualization',
  },
  [PromptCategory.FLOW_COLLABORATION]: {
    name: 'Flow Collaboration',
    description: 'Prompts for flow collaboration features including version control, reviews, and multi-user editing',
    module: 'FlowCollaboration',
  },
};

/**
 * Get all available prompt categories
 */
export function getPromptCategories(): PromptCategory[] {
  return Object.values(PromptCategory);
}

/**
 * Get metadata for a specific category
 */
export function getCategoryMetadata(category: PromptCategory) {
  return PROMPT_CATEGORY_METADATA[category];
}

/**
 * Get the module name for a specific category
 */
export function getCategoryModule(category: PromptCategory): string {
  return PROMPT_CATEGORY_METADATA[category].module;
}

/**
 * Get all exports from a specific prompt module
 */
export function getPromptModule(category: PromptCategory) {
  const moduleMap: Record<PromptCategory, object> = {
    [PromptCategory.CODE_GENERATION]: CodeGeneration,
    [PromptCategory.CODE_REVIEW]: CodeReview,
    [PromptCategory.BUG_DETECTION]: BugDetection,
    [PromptCategory.REQUIREMENT]: RequirementUnderstanding,
    [PromptCategory.CLARIFICATION]: Clarification,
    [PromptCategory.ENTITY_EXTRACTION]: EntityExtraction,
    [PromptCategory.RELATION_ANALYSIS]: RelationAnalysis,
    [PromptCategory.UI_GENERATION]: UiGeneration,
    [PromptCategory.UI_ANALYSIS]: UiAnalysis,
    [PromptCategory.UI_REFINEMENT]: UiRefinement,
    [PromptCategory.UI_TESTING]: UiTesting,
    [PromptCategory.PROMPT_ENGINEERING]: PromptEngineering,
    [PromptCategory.FLOW_EXECUTION]: FlowExecution,
    [PromptCategory.FLOW_GENERATION]: FlowGeneration,
    [PromptCategory.FLOW_ANALYSIS]: FlowAnalysis,
    [PromptCategory.FLOW_OPTIMIZATION]: FlowOptimization,
    [PromptCategory.FLOW_VISUALIZATION]: FlowVisualization,
    [PromptCategory.FLOW_COLLABORATION]: FlowCollaboration,
  };
  return moduleMap[category];
}
