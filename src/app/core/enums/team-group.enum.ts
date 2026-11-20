export enum TeamGroup {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  DESIGN_QA = 'DESIGN_QA',
}

export const TEAM_GROUPS: TeamGroup[] = Object.values(TeamGroup);

export const GROUP_LABELS: Record<TeamGroup, string> = {
  [TeamGroup.FRONTEND]: 'Frontend',
  [TeamGroup.BACKEND]: 'Backend',
  [TeamGroup.DESIGN_QA]: 'Design / QA',
};

const GROUPS_KEY = 'app_groups';

type GroupMap = Partial<Record<string, TeamGroup>>;

function readGroups(): GroupMap {
  const raw = localStorage.getItem(GROUPS_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as GroupMap;
  } catch {
    return {};
  }
}

export function resolveGroup(userId: number): TeamGroup {
  const stored = readGroups()[String(userId)];
  return stored ?? TEAM_GROUPS[userId % TEAM_GROUPS.length];
}

export function saveGroup(userId: number, group: TeamGroup): void {
  const groups = readGroups();
  groups[String(userId)] = group;
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}
