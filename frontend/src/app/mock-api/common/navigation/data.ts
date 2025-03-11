/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';
import {environment} from "../../../../environments/environment";


const chatNav: FuseNavigationItem = {
    id: 'chat',
    title: 'Chat',
    type: 'basic',
    icon: 'heroicons_outline:chat-bubble-bottom-center-text',
    link: '/ui/chat',
}

const agentsNav: FuseNavigationItem = {
    id: 'agents',
    title: 'Agents',
    type: 'basic',
    icon: 'heroicons_outline:squares-2x2',
    link: '/ui/agents/list',
}

const newAgentNav: FuseNavigationItem = {
    id: 'new-agent',
    title: 'New Agent',
    type: 'basic',
    icon: 'heroicons_outline:squares-plus',
    link: '/ui/agents/new',
}

const workflowsNav: FuseNavigationItem = {
    id: 'workflows',
    title: 'Workflows',
    type: 'basic',
    icon: 'heroicons_outline:server-stack',
    link: '/ui/workflows',
}

const codeReviewNav: FuseNavigationItem =     {
    id: 'codereviews',
    title: 'Code review',
    type: 'basic',
    icon: 'heroicons_outline:code-bracket-square',
    link: '/ui/code-reviews',
}

export const defaultNavigation: FuseNavigationItem[] = [
    chatNav,
    agentsNav,
    newAgentNav,
    workflowsNav,
    codeReviewNav
];

if (environment.modules?.trim().length) {
    defaultNavigation.length = 0
    const modules = environment.modules.trim().split(',').map(s => s.trim());

    if(modules.includes('chat')) defaultNavigation.push(chatNav);
    if(modules.includes('agents') || modules.includes('workflows')) defaultNavigation.push(agentsNav);
    if(modules.includes('agents')) defaultNavigation.push(newAgentNav);
    if(modules.includes('workflows')) defaultNavigation.push(workflowsNav);
    if(modules.includes('codeReview')) defaultNavigation.push(codeReviewNav);
}

export const compactNavigation: FuseNavigationItem[] = defaultNavigation;
export const futuristicNavigation: FuseNavigationItem[] = defaultNavigation;
export const horizontalNavigation: FuseNavigationItem[] = defaultNavigation;
