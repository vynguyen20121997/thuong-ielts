import type { ReadingLevel } from "./types";
type Skill = "reading" | "listening";
const LEVELS: Record<Skill, Record<number, ReadingLevel[]>> = {
  reading: { 10:["medium","medium","medium","medium"],11:["medium","medium","medium","hard"],12:["easy","hard","medium","medium"],13:["medium","medium","medium","hard"],14:["medium","medium","hard","medium"],15:["easy","medium","easy","easy"],16:["medium","easy","medium","medium"],17:["medium","hard","medium","medium"],18:["medium","easy","hard","hard"] },
  listening: { 10:["easy","medium","medium","medium"],11:["medium","medium","easy","hard"],12:["easy","hard","medium","hard"],13:["medium","medium","medium","hard"],14:["medium","medium","medium","hard"],15:["easy","medium","easy","medium"],16:["medium","easy","easy","easy"],17:["medium","medium","medium","hard"],18:["medium","medium","hard","easy"] },
};
export function keyPracticeLevel(skill:Skill,slug:string,fallback:ReadingLevel):ReadingLevel{const match=/^cam(1[0-8])-(?:listening-)?test(\d+)/i.exec(slug);if(!match)return fallback;return LEVELS[skill][Number(match[1])]?.[Number(match[2])-1]??fallback}
