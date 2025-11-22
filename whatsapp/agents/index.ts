// Export all agent definitions
import { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { onboardingAgent } from "./onboarding";
import { menuPlannerAgent } from "./menu-planner";
import { shoppingListAgent } from "./shopping-list";
import { ecommerceAgent } from "./ecommerce";

export { routerPrompt } from "./router";
export { onboardingAgent } from "./onboarding";
export { menuPlannerAgent } from "./menu-planner";
export { shoppingListAgent } from "./shopping-list";
export { ecommerceAgent } from "./ecommerce";

// Export configuration object with all agents
export const PLANEAT_AGENTS: Record<string, AgentDefinition> = {
  onboarding: onboardingAgent,
  "menu-planner": menuPlannerAgent,
  "shopping-list": shoppingListAgent,
  ecommerce: ecommerceAgent,
};
